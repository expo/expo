import url from 'url';

export function validateUrl(str: string): boolean {
  const results = url.parse(str, true);

  if (!results.protocol) {
    return false;
  }

  return true;
}
