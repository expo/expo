export function buildRoutePattern(segments: string[] | undefined | null): string | null {
  // eslint-disable-next-line eqeqeq
  if (segments == undefined) return null;
  if (segments.length === 0) return '/';
  return '/' + segments.join('/');
}
