/** Prefix for files in /public when the site is served from a sub-path. */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
export const asset = (path: string) => `${basePath}${path}`;
