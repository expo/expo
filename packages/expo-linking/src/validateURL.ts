import invariant from 'invariant';

export function validateURL(url: string): void {
  invariant(typeof url === 'string', 'Invalid URL: should be a string. Was: ' + url);
  invariant(url, 'Invalid URL: cannot be empty');
}
