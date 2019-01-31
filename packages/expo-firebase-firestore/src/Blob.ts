import { Base64 } from 'js-base64';
import invariant from 'invariant';
export default class Blob {
  _binaryString: string;

  constructor(binaryString: string) {
    this._binaryString = binaryString;
  }

  /**
   * Creates a new Blob from the given Base64 string
   *
   * @url https://firebase.google.com/docs/reference/js/firebase.firestore.Blob#.fromBase64String
   * @param base64 string
   */
  static fromBase64String(base64: string): Blob {
    invariant(
      base64 === 'string' && base64.length > 0,
      'firestore.Blob.fromBase64String expects a string of at least 1 character in length'
    );

    return new Blob(Base64.atob(base64));
  }

  /**
   * Creates a new Blob from the given Uint8Array.
   *
   * @url https://firebase.google.com/docs/reference/js/firebase.firestore.Blob#.fromUint8Array
   * @param array Array
   */
  static fromUint8Array(array: Uint8Array): Blob {
    invariant(
      array instanceof Uint8Array,
      'firestore.Blob.fromUint8Array expects an instance of Uint8Array'
    );

    return new Blob(
      Array.prototype.map.call(array, (char: number) => String.fromCharCode(char)).join('')
    );
  }

  /**
   * Returns 'true' if this Blob is equal to the provided one.
   * @url https://firebase.google.com/docs/reference/js/firebase.firestore.Blob#isEqual
   * @param {*} blob Blob The Blob to compare against. Value must not be null.
   * @returns boolean 'true' if this Blob is equal to the provided one.
   */
  isEqual(blob: Blob): boolean {
    invariant(blob instanceof Blob, 'firestore.Blob.isEqual expects an instance of Blob');

    return this._binaryString === blob._binaryString;
  }

  /**
   * Returns the bytes of a Blob as a Base64-encoded string.
   *
   * @url https://firebase.google.com/docs/reference/js/firebase.firestore.Blob#toBase64
   * @returns string The Base64-encoded string created from the Blob object.
   */
  toBase64(): string {
    return Base64.btoa(this._binaryString);
  }

  /**
   * Returns the bytes of a Blob in a new Uint8Array.
   *
   * @url https://firebase.google.com/docs/reference/js/firebase.firestore.Blob#toUint8Array
   * @returns non-null Uint8Array The Uint8Array created from the Blob object.
   */
  toUint8Array(): Uint8Array {
    return new Uint8Array(this._binaryString.split('').map(c => c.charCodeAt(0)));
  }

  /**
   * Returns a string representation of this blob instance
   *
   * @returns {string}
   * @memberof Blob
   */
  toString(): string {
    return `firestore.Blob(base64: ${this.toBase64()})`;
  }
}
