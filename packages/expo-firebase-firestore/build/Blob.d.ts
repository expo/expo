export default class Blob {
    _binaryString: string;
    constructor(binaryString: string);
    /**
     * Creates a new Blob from the given Base64 string
     *
     * @url https://firebase.google.com/docs/reference/js/firebase.firestore.Blob#.fromBase64String
     * @param base64 string
     */
    static fromBase64String(base64: string): Blob;
    /**
     * Creates a new Blob from the given Uint8Array.
     *
     * @url https://firebase.google.com/docs/reference/js/firebase.firestore.Blob#.fromUint8Array
     * @param array Array
     */
    static fromUint8Array(array: Uint8Array): Blob;
    /**
     * Returns 'true' if this Blob is equal to the provided one.
     * @url https://firebase.google.com/docs/reference/js/firebase.firestore.Blob#isEqual
     * @param {*} blob Blob The Blob to compare against. Value must not be null.
     * @returns boolean 'true' if this Blob is equal to the provided one.
     */
    isEqual(blob: Blob): boolean;
    /**
     * Returns the bytes of a Blob as a Base64-encoded string.
     *
     * @url https://firebase.google.com/docs/reference/js/firebase.firestore.Blob#toBase64
     * @returns string The Base64-encoded string created from the Blob object.
     */
    toBase64(): string;
    /**
     * Returns the bytes of a Blob in a new Uint8Array.
     *
     * @url https://firebase.google.com/docs/reference/js/firebase.firestore.Blob#toUint8Array
     * @returns non-null Uint8Array The Uint8Array created from the Blob object.
     */
    toUint8Array(): Uint8Array;
    /**
     * Returns a string representation of this blob instance
     *
     * @returns {string}
     * @memberof Blob
     */
    toString(): string;
}
