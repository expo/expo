import path from 'node:path';

export function normalizePath(pathname: string): string {
  const stripped = pathname.replace(/\/+$/, '');
  return stripped === '' ? '/' : stripped;
}

export function pagePathFromHtmlFile(outDir: string, filePath: string): string {
  const relative = path.relative(outDir, path.dirname(filePath)).replace(/\\/g, '/');
  return normalizePath(`/${relative}`.replace(/\/\.$/, ''));
}

export function collapseVersion(pagePath: string): string {
  return pagePath.replace(/^\/versions\/[^/]+/, '/versions/*');
}
