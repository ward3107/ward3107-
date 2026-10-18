"""Check local resources referenced by static HTML entry pages (stdlib only)."""
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path.cwd().resolve()

class Resources(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.urls = []
        self.has_title = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "title":
            self.has_title = True
        if tag in {"script", "img", "source", "video", "audio", "iframe"}:
            if attrs.get("src"):
                self.urls.append(attrs["src"])
            if tag == "video" and attrs.get("poster"):
                self.urls.append(attrs["poster"])
        if tag == "link" and set(attrs.get("rel", "").split()) & {"stylesheet", "icon", "manifest", "apple-touch-icon"}:
            if attrs.get("href"):
                self.urls.append(attrs["href"])

def check(page, root=ROOT):
    page = page.resolve()
    parser = Resources()
    parser.feed(page.read_text(encoding="utf-8"))
    parser.close()
    errors = [] if parser.has_title else [f"{page}: missing document title"]
    for raw in parser.urls:
        url = urlsplit(raw)
        if url.scheme or url.netloc or not url.path:
            continue
        path = unquote(url.path)
        target = (root / path.lstrip("/") if path.startswith("/") else page.parent / path).resolve()
        if not target.is_relative_to(root):
            errors.append(f"{page}: resource escapes site root: {raw}")
        elif not target.is_file():
            errors.append(f"{page}: missing local resource: {raw}")
    return errors

if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit("Pass at least one HTML entry page.")
    errors = []
    for name in sys.argv[1:]:
        try:
            errors.extend(check(Path(name)))
        except (OSError, ValueError) as error:
            errors.append(f"{name}: {error}")
    if errors:
        raise SystemExit("\n".join(errors))
    print(f"Checked local resources in {len(sys.argv) - 1} page(s).")
