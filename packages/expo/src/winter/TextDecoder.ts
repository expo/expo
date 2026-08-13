// UTF-8-only TextDecoder fallback for runtimes that do not provide one.

const UTF8_LABELS = new Set([
  'unicode-1-1-utf-8',
  'unicode11utf8',
  'unicode20utf8',
  'utf-8',
  'utf8',
  'x-unicode20utf8',
]);

const EMPTY_BYTES = new Uint8Array(0);

interface DecodeResult {
  output: string;
  pending: Uint8Array;
  BOMseen: boolean;
}

function normalizeBytes(input: ArrayBuffer | ArrayBufferView | undefined): Uint8Array {
  if (input === undefined) {
    return EMPTY_BYTES;
  } else if (input instanceof Uint8Array) {
    return input;
  } else if (input instanceof ArrayBuffer) {
    return new Uint8Array(input);
  } else if (ArrayBuffer.isView(input)) {
    return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  } else {
    throw new TypeError('The input must be an ArrayBuffer or ArrayBufferView');
  }
}

function decoderError(fatal: boolean): number {
  if (fatal) {
    throw new TypeError('Decoder error');
  } else {
    return 0xfffd;
  }
}

function appendASCII(output: string, bytes: Uint8Array, start: number, end: number): string {
  // NOTE(@kitten): For longer strings, direct `apply` + `subarray` conversion w/o byte-for-byte copy or spreads is
  // the most efficient by far (3x), leaning on native conversion below the variadic limit
  const HERMES_VARIADIC_ARGUMENT_LIMIT = 4096;
  while (start < end) {
    output += String.fromCharCode.apply(
      null,
      bytes.subarray(
        start,
        Math.min(start + HERMES_VARIADIC_ARGUMENT_LIMIT, end)
      ) as unknown as number[]
    );
    start += HERMES_VARIADIC_ARGUMENT_LIMIT;
  }
  return output;
}

function decodeUTF8Fast(bytes: Uint8Array, start: number): string | null {
  let output = '';
  let i = start;
  const length = bytes.length;
  while (i < length) {
    const b0 = bytes[i]!;
    if (b0 < 0x80) {
      // NOTE(@kitten): For ASCII text, it's fastest to process the first 32 chars directly
      // After, `appendASCII`'s variadic apply wins out
      const directEnd = Math.min(i + 32, length);
      do {
        output += String.fromCharCode(bytes[i++]!);
      } while (i < directEnd && bytes[i]! < 0x80);
      if (i === directEnd && i < length && bytes[i]! < 0x80) {
        const start = i;
        do {
          i++;
        } while (i < length && bytes[i]! < 0x80);
        output = appendASCII(output, bytes, start, i);
      }
    } else if (b0 >= 0xc2 && b0 <= 0xdf) {
      if (i + 1 >= length) return null;
      const b1 = bytes[i + 1]!;
      if ((b1 & 0xc0) !== 0x80) return null;
      output += String.fromCharCode(((b0 & 0x1f) << 6) | (b1 & 0x3f));
      i += 2;
    } else if (b0 >= 0xe0 && b0 <= 0xef) {
      if (i + 2 >= length) return null;
      const b1 = bytes[i + 1]!;
      const b2 = bytes[i + 2]!;
      if (
        b1 < (b0 === 0xe0 ? 0xa0 : 0x80) ||
        b1 > (b0 === 0xed ? 0x9f : 0xbf) ||
        (b2 & 0xc0) !== 0x80
      ) {
        return null;
      }
      output += String.fromCharCode(((b0 & 0x0f) << 12) | ((b1 & 0x3f) << 6) | (b2 & 0x3f));
      i += 3;
    } else if (b0 >= 0xf0 && b0 <= 0xf4) {
      if (i + 3 >= length) return null;
      const b1 = bytes[i + 1]!;
      const b2 = bytes[i + 2]!;
      const b3 = bytes[i + 3]!;
      if (
        b1 < (b0 === 0xf0 ? 0x90 : 0x80) ||
        b1 > (b0 === 0xf4 ? 0x8f : 0xbf) ||
        (b2 & 0xc0) !== 0x80 ||
        (b3 & 0xc0) !== 0x80
      ) {
        return null;
      }
      const codePoint =
        (((b0 & 0x07) << 18) | ((b1 & 0x3f) << 12) | ((b2 & 0x3f) << 6) | (b3 & 0x3f)) - 0x10000;
      output += String.fromCharCode((codePoint >> 10) + 0xd800, (codePoint & 0x3ff) + 0xdc00);
      i += 4;
    } else {
      return null;
    }
  }
  return output;
}

function decodeUTF8General(
  bytes: Uint8Array,
  pending: Uint8Array,
  stream: boolean,
  fatal: boolean,
  ignoreBOM: boolean,
  BOMseen: boolean
): DecodeResult {
  let output = '';
  let i = 0;

  if (pending.length > 0) {
    const b0 = pending[0]!;
    const bytesNeeded = b0 <= 0xdf ? 1 : b0 <= 0xef ? 2 : 3;
    let codePoint = b0 & (bytesNeeded === 1 ? 0x1f : bytesNeeded === 2 ? 0x0f : 0x07);
    let bytesSeen = 0;

    for (let p = 1; p < pending.length; p++) {
      codePoint = (codePoint << 6) | (pending[p]! & 0x3f);
      bytesSeen++;
    }

    while (bytesSeen < bytesNeeded && i < bytes.length) {
      const byte = bytes[i]!;
      if (
        (byte & 0xc0) !== 0x80 ||
        (bytesSeen === 0 &&
          ((b0 === 0xe0 && byte < 0xa0) ||
            (b0 === 0xed && byte > 0x9f) ||
            (b0 === 0xf0 && byte < 0x90) ||
            (b0 === 0xf4 && byte > 0x8f)))
      ) {
        pending = EMPTY_BYTES;
        output += String.fromCharCode(decoderError(fatal));
        BOMseen = true;
        break;
      }
      codePoint = (codePoint << 6) | (byte & 0x3f);
      bytesSeen++;
      i++;
    }

    if (bytesSeen === bytesNeeded) {
      pending = EMPTY_BYTES;
      if (BOMseen || ignoreBOM || codePoint !== 0xfeff) {
        if (codePoint <= 0xffff) output += String.fromCharCode(codePoint);
        else {
          codePoint -= 0x10000;
          output += String.fromCharCode((codePoint >> 10) + 0xd800, (codePoint & 0x3ff) + 0xdc00);
        }
      }
      BOMseen = true;
    } else if (i === bytes.length) {
      if (stream && i > 0) {
        const nextPending = new Uint8Array(pending.length + i);
        nextPending.set(pending);
        nextPending.set(bytes.subarray(0, i), pending.length);
        pending = nextPending;
      } else if (!stream) {
        pending = EMPTY_BYTES;
        output += String.fromCharCode(decoderError(fatal));
        BOMseen = true;
      }
    }

    if (pending.length > 0) {
      return { output, pending, BOMseen };
    }
  }

  while (i < bytes.length) {
    const b0 = bytes[i]!;
    if (b0 < 0x80) {
      BOMseen = true;
      const directEnd = Math.min(i + 32, bytes.length);
      do {
        output += String.fromCharCode(bytes[i++]!);
      } while (i < directEnd && bytes[i]! < 0x80);
      if (i === directEnd && i < bytes.length && bytes[i]! < 0x80) {
        const start = i;
        do {
          i++;
        } while (i < bytes.length && bytes[i]! < 0x80);
        output = appendASCII(output, bytes, start, i);
      }
      continue;
    }

    let codePoint: number;
    if (b0 >= 0xc2 && b0 <= 0xdf) {
      if (i + 1 >= bytes.length) {
        if (stream) pending = bytes.slice(i);
        else output += String.fromCharCode(decoderError(fatal));
        break;
      }
      const b1 = bytes[i + 1]!;
      if ((b1 & 0xc0) !== 0x80) {
        output += String.fromCharCode(decoderError(fatal));
        BOMseen = true;
        i++;
        continue;
      }
      codePoint = ((b0 & 0x1f) << 6) | (b1 & 0x3f);
      i += 2;
    } else if (b0 >= 0xe0 && b0 <= 0xef) {
      if (i + 1 >= bytes.length) {
        if (stream) pending = bytes.slice(i);
        else output += String.fromCharCode(decoderError(fatal));
        break;
      }
      const b1 = bytes[i + 1]!;
      if ((b1 & 0xc0) !== 0x80 || (b0 === 0xe0 && b1 < 0xa0) || (b0 === 0xed && b1 > 0x9f)) {
        output += String.fromCharCode(decoderError(fatal));
        BOMseen = true;
        i++;
        continue;
      }
      if (i + 2 >= bytes.length) {
        if (stream) pending = bytes.slice(i);
        else output += String.fromCharCode(decoderError(fatal));
        break;
      }
      const b2 = bytes[i + 2]!;
      if ((b2 & 0xc0) !== 0x80) {
        output += String.fromCharCode(decoderError(fatal));
        BOMseen = true;
        i += 2;
        continue;
      }
      codePoint = ((b0 & 0x0f) << 12) | ((b1 & 0x3f) << 6) | (b2 & 0x3f);
      i += 3;
    } else if (b0 >= 0xf0 && b0 <= 0xf4) {
      if (i + 1 >= bytes.length) {
        if (stream) pending = bytes.slice(i);
        else output += String.fromCharCode(decoderError(fatal));
        break;
      }
      const b1 = bytes[i + 1]!;
      if ((b1 & 0xc0) !== 0x80 || (b0 === 0xf0 && b1 < 0x90) || (b0 === 0xf4 && b1 > 0x8f)) {
        output += String.fromCharCode(decoderError(fatal));
        BOMseen = true;
        i++;
        continue;
      }
      if (i + 2 >= bytes.length) {
        if (stream) pending = bytes.slice(i);
        else output += String.fromCharCode(decoderError(fatal));
        break;
      }
      const b2 = bytes[i + 2]!;
      if ((b2 & 0xc0) !== 0x80) {
        output += String.fromCharCode(decoderError(fatal));
        BOMseen = true;
        i += 2;
        continue;
      }
      if (i + 3 >= bytes.length) {
        if (stream) pending = bytes.slice(i);
        else output += String.fromCharCode(decoderError(fatal));
        break;
      }
      const b3 = bytes[i + 3]!;
      if ((b3 & 0xc0) !== 0x80) {
        output += String.fromCharCode(decoderError(fatal));
        BOMseen = true;
        i += 3;
        continue;
      }
      codePoint = ((b0 & 0x07) << 18) | ((b1 & 0x3f) << 12) | ((b2 & 0x3f) << 6) | (b3 & 0x3f);
      i += 4;
    } else {
      output += String.fromCharCode(decoderError(fatal));
      BOMseen = true;
      i++;
      continue;
    }

    if (BOMseen || ignoreBOM || codePoint !== 0xfeff) {
      if (codePoint <= 0xffff) {
        output += String.fromCharCode(codePoint);
      } else {
        codePoint -= 0x10000;
        output += String.fromCharCode((codePoint >> 10) + 0xd800, (codePoint & 0x3ff) + 0xdc00);
      }
    }
    BOMseen = true;
  }

  return { output, pending, BOMseen };
}

function decodeUTF8(
  bytes: Uint8Array,
  pending: Uint8Array,
  stream: boolean,
  fatal: boolean,
  ignoreBOM: boolean,
  BOMseen: boolean
): DecodeResult {
  if (pending.length === 0) {
    if (!stream && !BOMseen) {
      const skipBOM =
        !ignoreBOM && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? 3 : 0;
      const fast = decodeUTF8Fast(bytes, skipBOM);
      if (fast !== null) return { output: fast, pending, BOMseen: bytes.length > 0 };
    }
  }

  return decodeUTF8General(bytes, pending, stream, fatal, ignoreBOM, BOMseen);
}

// @docsMissing
export class TextDecoder {
  private readonly _ignoreBOM: boolean;
  private readonly _fatal: boolean;
  private _BOMseen = false;
  private _pending: Uint8Array = EMPTY_BYTES;
  private _streaming = false;

  constructor(label: string = 'utf-8', options: { fatal?: boolean; ignoreBOM?: boolean } = {}) {
    if (options == null || typeof options !== 'object') {
      throw new TypeError(
        'Second argument of TextDecoder must be undefined or an object, e.g. { fatal: true }'
      );
    }
    const normalizedLabel = String(label).trim().toLowerCase();
    if (!UTF8_LABELS.has(normalizedLabel)) {
      throw new RangeError(`Unknown encoding: ${label} (normalized: ${normalizedLabel})`);
    }
    this._fatal = Boolean(options.fatal);
    this._ignoreBOM = Boolean(options.ignoreBOM);
  }

  get encoding(): string {
    return 'utf-8';
  }

  get fatal(): boolean {
    return this._fatal;
  }

  get ignoreBOM(): boolean {
    return this._ignoreBOM;
  }

  decode(input?: ArrayBuffer | ArrayBufferView, options: { stream?: boolean } = {}): string {
    if (options == null || typeof options !== 'object') {
      throw new TypeError('The options argument must be undefined or an object');
    }
    const bytes = normalizeBytes(input);
    const stream = Boolean(options.stream);
    if (!this._streaming) {
      this._BOMseen = false;
      this._pending = EMPTY_BYTES;
    }

    try {
      const result = decodeUTF8(
        bytes,
        this._pending,
        stream,
        this._fatal,
        this._ignoreBOM,
        this._BOMseen
      );
      this._pending = result.pending;
      this._BOMseen = result.BOMseen;
      this._streaming = stream;
      return result.output;
    } catch (error) {
      this._pending = EMPTY_BYTES;
      this._streaming = false;
      throw error;
    }
  }
}
