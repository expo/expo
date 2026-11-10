const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const FORM_CONTENT_TYPES = new Set([
  'application/x-www-form-urlencoded',
  'multipart/form-data',
  'text/plain',
]);

export function isForbiddenOrigin(
  request: Request,
  checkOrigin: boolean | 'sec-only' = true,
  origin?: string
): boolean {
  if (!checkOrigin || SAFE_METHODS.has(request.method)) {
    return false;
  }
  const contentType = request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase();
  if (contentType && !FORM_CONTENT_TYPES.has(contentType)) {
    return false;
  }
  switch (request.headers.get('sec-fetch-site')) {
    case 'same-origin':
    case 'none':
      return false;
    case null:
    case '':
      break;
    default:
      return true;
  }
  if (checkOrigin === 'sec-only') {
    return false;
  }
  const sourceOrigin = request.headers.get('origin');
  return (
    sourceOrigin !== null && sourceOrigin !== new URL(request.url).origin && sourceOrigin !== origin
  );
}
