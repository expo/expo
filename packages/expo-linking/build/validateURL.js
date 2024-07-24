import invariant from 'invariant';
export function validateURL(url) {
    invariant(typeof url === 'string', 'Invalid URL: should be a string. Was: ' + url);
    invariant(url, 'Invalid URL: cannot be empty');
}
//# sourceMappingURL=validateURL.js.map