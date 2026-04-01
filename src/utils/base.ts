/** Prefix a local path with the site's base URL (handles both `/` and `/estebike/`). */
export function url(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return base + path;
}
