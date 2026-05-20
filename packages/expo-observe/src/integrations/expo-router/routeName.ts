export function buildRoutePattern(segments: string[] | undefined): string | undefined {
  if (segments === undefined) return undefined;
  if (segments.length === 0) return '/';
  return '/' + segments.join('/');
}
