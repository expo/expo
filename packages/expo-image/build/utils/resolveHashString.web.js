/**
 * Converts a string in blurhash format (`blurhash:/<hash>/<width>/<height>`
 * or <hash>/<width>/<height>) into an `ImageSource`.
 *
 * @return An ImageSource representing the provided blurhash.
 * */
export function resolveBlurhashString(str) {
    const [hash, width, height] = str.replace(/^blurhash:\//, '').split('/');
    return {
        uri: 'blurhash:/' + hash,
        width: parseInt(width, 10) || 16,
        height: parseInt(height, 10) || 16,
    };
}
/**
 * Converts a string in thumbhash format (`thumbhash:/<hash>` or `<hash>`)
 * into an `ImageSource`.
 * Note: Unlike the `resolveBlurhashString` the `thumbhash:/` scheme has to be present,
 * as the scheme has to be explicitly stated to be interpreted a `thumbhash` source.
 *
 * @return An ImageSource representing the provided thumbhash.
 * */
export function resolveThumbhashString(str) {
    const hash = str.replace(/^thumbhash:\//, '');
    return {
        uri: 'thumbhash:/' + hash,
    };
}
//# sourceMappingURL=resolveHashString.web.js.map