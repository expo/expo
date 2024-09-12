// A fork of text-encoding but with only UTF-8 decoder.
// `TextEncoder` is in Hermes and we only need utf-8 decoder for React Server Components.
//
// https://github.com/inexorabletash/text-encoding/blob/3f330964c0e97e1ed344c2a3e963f4598610a7ad/lib/encoding.js#L1

/**
 * Checks if a number is within a specified range.
 * @param a The number to test.
 * @param min The minimum value in the range, inclusive.
 * @param max The maximum value in the range, inclusive.
 * @returns `true` if a passed number is within the specified range.
 */
function inRange(a: number, min: number, max: number): boolean {
  return min <= a && a <= max;
}

/**
 * Converts an array of code points to a string.
 * @param codePoints Array of code points.
 * @returns The string representation of given array.
 */
function codePointsToString(codePoints: number[]): string {
  let s = '';
  for (let i = 0; i < codePoints.length; ++i) {
    let cp = codePoints[i];
    if (cp <= 0xffff) {
      s += String.fromCharCode(cp);
    } else {
      cp -= 0x10000;
      s += String.fromCharCode((cp >> 10) + 0xd800, (cp & 0x3ff) + 0xdc00);
    }
  }
  return s;
}

function normalizeBytes(input?: ArrayBuffer | DataView): Uint8Array {
  if (typeof input === 'object' && input instanceof ArrayBuffer) {
    return new Uint8Array(input);
  } else if (
    typeof input === 'object' &&
    'buffer' in input &&
    input.buffer instanceof ArrayBuffer
  ) {
    return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  }
  return new Uint8Array(0);
}

/**
 * End-of-stream is a special token that signifies no more tokens
 * are in the stream.
 */
const END_OF_STREAM = -1;

const FINISHED = -1;

/**
 * A stream represents an ordered sequence of tokens.
 *
 * @constructor
 * @param {!(number[]|Uint8Array)} tokens Array of tokens that provide the stream.
 */
class Stream {
  private tokens: number[];

  constructor(tokens: number[] | Uint8Array) {
    this.tokens = Array.prototype.slice.call(tokens);
    // Reversed as push/pop is more efficient than shift/unshift.
    this.tokens.reverse();
  }

  /**
   * @return {boolean} True if end-of-stream has been hit.
   */
  endOfStream(): boolean {
    return !this.tokens.length;
  }

  /**
   * When a token is read from a stream, the first token in the
   * stream must be returned and subsequently removed, and
   * end-of-stream must be returned otherwise.
   *
   * @return {number} Get the next token from the stream, or
   * end_of_stream.
   */
  read(): number {
    if (!this.tokens.length) return END_OF_STREAM;
    return this.tokens.pop()!;
  }

  /**
   * When one or more tokens are prepended to a stream, those tokens
   * must be inserted, in given order, before the first token in the
   * stream.
   *
   * @param token The token(s) to prepend to the stream.
   */
  prepend(token: number | number[]): void {
    if (Array.isArray(token)) {
      while (token.length) this.tokens.push(token.pop()!);
    } else {
      this.tokens.push(token);
    }
  }

  /**
   * When one or more tokens are pushed to a stream, those tokens
   * must be inserted, in given order, after the last token in the
   * stream.
   *
   * @param token The tokens(s) to push to the stream.
   */
  push(token: number | number[]): void {
    if (Array.isArray(token)) {
      while (token.length) this.tokens.unshift(token.shift()!);
    } else {
      this.tokens.unshift(token);
    }
  }
}

function decoderError(fatal: boolean, opt_code_point?: number) {
  if (fatal) throw TypeError('Decoder error');
  return opt_code_point || 0xfffd;
}

interface Encoding {
  name: string;
  labels: string[];
}

const LABEL_ENCODING_MAP: { [key: string]: Encoding } = {};

function getEncoding(label: string): Encoding | null {
  label = label.trim().toLowerCase();
  if (label in LABEL_ENCODING_MAP) {
    return LABEL_ENCODING_MAP[label];
  }
  return null;
}

/** [Encodings table](https://encoding.spec.whatwg.org/encodings.json) (Incomplete as we only need TextDecoder utf8 in Expo RSC. A more complete implementation should be added to Hermes as native code.) */
const ENCODING_MAP: { heading: string; encodings: Encoding[] }[] = [
  {
    encodings: [
      {
        labels: [
          'unicode-1-1-utf-8',
          'unicode11utf8',
          'unicode20utf8',
          'utf-8',
          'utf8',
          'x-unicode20utf8',
        ],
        name: 'UTF-8',
      },
    ],
    heading: 'The Encoding',
  },
];

ENCODING_MAP.forEach((category) => {
  category.encodings.forEach((encoding) => {
    encoding.labels.forEach((label) => {
      LABEL_ENCODING_MAP[label] = encoding;
    });
  });
});

// Registry of of encoder/decoder factories, by encoding name.
const DECODERS: { [key: string]: (options: { fatal: boolean }) => UTF8Decoder } = {
  'UTF-8': (options) => new UTF8Decoder(options),
};

// 9.1.1 utf-8 decoder

interface Decoder {
  handler: (stream: Stream, bite: number) => number | number[] | null | -1;
}

class UTF8Decoder implements Decoder {
  // utf-8's decoder's has an associated utf-8 code point, utf-8
  // bytes seen, and utf-8 bytes needed (all initially 0), a utf-8
  // lower boundary (initially 0x80), and a utf-8 upper boundary
  // (initially 0xBF).
  private utf8CodePoint = 0;
  private utf8BytesSeen = 0;
  private utf8BytesNeeded = 0;
  private utf8LowerBoundary = 0x80;
  private utf8UpperBoundary = 0xbf;
  constructor(private options: { fatal: boolean }) {}
  /**
   * @param {Stream} stream The stream of bytes being decoded.
   * @param {number} bite The next byte read from the stream.
   * @return {?(number|!Array.<number>)} The next code point(s)
   *     decoded, or null if not enough data exists in the input
   *     stream to decode a complete code point.
   */
  handler(stream: Stream, bite: number): number | null | -1 {
    // 1. If byte is end-of-stream and utf-8 bytes needed is not 0,
    // set utf-8 bytes needed to 0 and return error.
    if (bite === END_OF_STREAM && this.utf8BytesNeeded !== 0) {
      this.utf8BytesNeeded = 0;
      return decoderError(this.options.fatal);
    }

    // 2. If byte is end-of-stream, return finished.
    if (bite === END_OF_STREAM) return FINISHED;

    // 3. If utf-8 bytes needed is 0, based on byte:
    if (this.utf8BytesNeeded === 0) {
      // 0x00 to 0x7F
      if (inRange(bite, 0x00, 0x7f)) {
        // Return a code point whose value is byte.
        return bite;
      }

      // 0xC2 to 0xDF
      else if (inRange(bite, 0xc2, 0xdf)) {
        // 1. Set utf-8 bytes needed to 1.
        this.utf8BytesNeeded = 1;

        // 2. Set UTF-8 code point to byte & 0x1F.
        this.utf8CodePoint = bite & 0x1f;
      }

      // 0xE0 to 0xEF
      else if (inRange(bite, 0xe0, 0xef)) {
        // 1. If byte is 0xE0, set utf-8 lower boundary to 0xA0.
        if (bite === 0xe0) this.utf8LowerBoundary = 0xa0;
        // 2. If byte is 0xED, set utf-8 upper boundary to 0x9F.
        if (bite === 0xed) this.utf8UpperBoundary = 0x9f;
        // 3. Set utf-8 bytes needed to 2.
        this.utf8BytesNeeded = 2;
        // 4. Set UTF-8 code point to byte & 0xF.
        this.utf8CodePoint = bite & 0xf;
      }

      // 0xF0 to 0xF4
      else if (inRange(bite, 0xf0, 0xf4)) {
        // 1. If byte is 0xF0, set utf-8 lower boundary to 0x90.
        if (bite === 0xf0) this.utf8LowerBoundary = 0x90;
        // 2. If byte is 0xF4, set utf-8 upper boundary to 0x8F.
        if (bite === 0xf4) this.utf8UpperBoundary = 0x8f;
        // 3. Set utf-8 bytes needed to 3.
        this.utf8BytesNeeded = 3;
        // 4. Set UTF-8 code point to byte & 0x7.
        this.utf8CodePoint = bite & 0x7;
      }

      // Otherwise
      else {
        // Return error.
        return decoderError(this.options.fatal);
      }

      // Return continue.
      return null;
    }

    // 4. If byte is not in the range utf-8 lower boundary to utf-8
    // upper boundary, inclusive, run these substeps:
    if (!inRange(bite, this.utf8LowerBoundary, this.utf8UpperBoundary)) {
      // 1. Set utf-8 code point, utf-8 bytes needed, and utf-8
      // bytes seen to 0, set utf-8 lower boundary to 0x80, and set
      // utf-8 upper boundary to 0xBF.
      this.utf8CodePoint = 0;
      this.utf8BytesNeeded = 0;
      this.utf8BytesSeen = 0;
      this.utf8LowerBoundary = 0x80;
      this.utf8UpperBoundary = 0xbf;

      // 2. Prepend byte to stream.
      stream.prepend(bite);

      // 3. Return error.
      return decoderError(this.options.fatal);
    }

    // 5. Set utf-8 lower boundary to 0x80 and utf-8 upper boundary
    // to 0xBF.
    this.utf8LowerBoundary = 0x80;
    this.utf8UpperBoundary = 0xbf;

    // 6. Set UTF-8 code point to (UTF-8 code point << 6) | (byte &
    // 0x3F)
    this.utf8CodePoint = (this.utf8CodePoint << 6) | (bite & 0x3f);

    // 7. Increase utf-8 bytes seen by one.
    this.utf8BytesSeen += 1;

    // 8. If utf-8 bytes seen is not equal to utf-8 bytes needed,
    // continue.
    if (this.utf8BytesSeen !== this.utf8BytesNeeded) return null;

    // 9. Let code point be utf-8 code point.
    const code_point = this.utf8CodePoint;

    // 10. Set utf-8 code point, utf-8 bytes needed, and utf-8 bytes
    // seen to 0.
    this.utf8CodePoint = 0;
    this.utf8BytesNeeded = 0;
    this.utf8BytesSeen = 0;

    // 11. Return a code point whose value is code point.
    return code_point;
  }
}

// 8.1 Interface TextDecoder
// @docsMissing
export class TextDecoder {
  private _encoding: Encoding | null;
  private _ignoreBOM: boolean;
  private _errorMode: string;
  private _BOMseen: boolean = false;
  private _doNotFlush: boolean = false;
  private _decoder: UTF8Decoder | null = null;

  constructor(
    label: string = 'utf-8',
    options: {
      fatal?: boolean;
      ignoreBOM?: boolean;
    } = {}
  ) {
    if (options != null && typeof options !== 'object') {
      throw new TypeError(
        'Second argument of TextDecoder must be undefined or an object, e.g. { fatal: true }'
      );
    }

    const normalizedLabel = String(label).trim().toLowerCase();
    const encoding = getEncoding(normalizedLabel);
    if (encoding === null || encoding.name === 'replacement') {
      throw new RangeError(`Unknown encoding: ${label} (normalized: ${normalizedLabel})`);
    }

    if (!DECODERS[encoding.name]) {
      throw new Error(`Decoder not present: ${encoding.name}`);
    }

    this._encoding = encoding;
    this._ignoreBOM = !!options.ignoreBOM;
    this._errorMode = options.fatal ? 'fatal' : 'replacement';
  }

  // Getter methods for encoding, fatal, and ignoreBOM
  get encoding(): string {
    return this._encoding?.name.toLowerCase() ?? '';
  }

  get fatal(): boolean {
    return this._errorMode === 'fatal';
  }

  get ignoreBOM(): boolean {
    return this._ignoreBOM;
  }

  decode(input?: ArrayBuffer | DataView, options: { stream?: boolean } = {}): string {
    const bytes = normalizeBytes(input);

    // 1. If the do not flush flag is unset, set decoder to a new
    // encoding's decoder, set stream to a new stream, and unset the
    // BOM seen flag.
    if (!this._doNotFlush) {
      this._decoder = DECODERS[this._encoding!.name]({
        fatal: this.fatal,
      });
      this._BOMseen = false;
    }

    // 2. If options's stream is true, set the do not flush flag, and
    // unset the do not flush flag otherwise.
    this._doNotFlush = Boolean(options['stream']);

    // 3. If input is given, push a copy of input to stream.
    // TODO: Align with spec algorithm - maintain stream on instance.
    const input_stream = new Stream(bytes);

    // 4. Let output be a new stream.
    const output: number[] = [];

    while (true) {
      const token = input_stream.read();

      if (token === END_OF_STREAM) break;

      const result = this._decoder!.handler(input_stream, token);

      if (result === FINISHED) break;

      if (result !== null) {
        output.push(result);
      }
    }

    if (!this._doNotFlush) {
      do {
        const result = this._decoder!.handler(input_stream, input_stream.read());
        if (result === FINISHED) break;
        if (result === null) continue;
        if (Array.isArray(result)) output.push(...result);
        else output.push(result);
      } while (!input_stream.endOfStream());
      this._decoder = null;
    }

    return this.serializeStream(output);
  }

  // serializeStream method for converting code points to a string
  private serializeStream(stream: number[]): string {
    if (this._encoding!.name === 'UTF-8') {
      if (!this._ignoreBOM && !this._BOMseen && stream[0] === 0xfeff) {
        // If BOM is detected at the start of the stream and we're not ignoring it
        this._BOMseen = true;
        stream.shift(); // Remove the BOM
      } else if (stream.length > 0) {
        this._BOMseen = true;
      }
    }

    // Convert the stream of code points to a string
    return codePointsToString(stream);
  }
}
