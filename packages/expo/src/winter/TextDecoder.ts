// UTF-8-only TextDecoder fallback for runtimes that do not provide one.

const EMPTY_BYTES = new Uint8Array(0);

interface TextDecoderState {
  ignoreBOM: boolean;
  fatal: boolean;
  bomSeen: boolean;
  pending: Uint8Array;
  streaming: boolean;
}

function assertValidUTF8Label(label: unknown): void {
  const normalizedLabel = String(label).trim().toLowerCase();
  switch (normalizedLabel) {
    case 'unicode-1-1-utf-8':
    case 'unicode11utf8':
    case 'unicode20utf8':
    case 'utf-8':
    case 'utf8':
    case 'x-unicode20utf8':
      return;
    default:
      throw new RangeError(`Unknown encoding: ${label} (normalized: ${normalizedLabel})`);
  }
}

function normalizeBytes(input: ArrayBuffer | ArrayBufferView | undefined): Uint8Array {
  if (input === undefined) {
    return EMPTY_BYTES;
  } else if (input instanceof Uint8Array) {
    return input;
  } else if (ArrayBuffer.isView(input)) {
    return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  } else if (
    (input[Symbol.toStringTag] as string) === 'ArrayBuffer' ||
    (input[Symbol.toStringTag] as string) === 'SharedArrayBuffer'
  ) {
    return new Uint8Array(input as ArrayBuffer);
  } else {
    throw new TypeError('The input must be an ArrayBuffer or ArrayBufferView');
  }
}

function decoderError(state: TextDecoderState): string {
  if (state.fatal) {
    throw new TypeError('Decoder error');
  }
  return '\ufffd';
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

interface DecodeFallback {
  output: string;
  index: number;
}

function fallback(output: string, index: number): DecodeFallback {
  return { output, index };
}

function decodeUTF8Fast(bytes: Uint8Array, start: number): string | DecodeFallback {
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
        const asciiStart = i;
        do {
          i++;
        } while (i < length && bytes[i]! < 0x80);
        output = appendASCII(output, bytes, asciiStart, i);
      }
    } else if (b0 >= 0xc2 && b0 <= 0xdf) {
      if (i + 1 >= length) return fallback(output, i);
      const b1 = bytes[i + 1]!;
      if ((b1 & 0xc0) !== 0x80) return fallback(output, i);
      output += String.fromCharCode(((b0 & 0x1f) << 6) | (b1 & 0x3f));
      i += 2;
    } else if (b0 >= 0xe0 && b0 <= 0xef) {
      if (i + 2 >= length) return fallback(output, i);
      const b1 = bytes[i + 1]!;
      const b2 = bytes[i + 2]!;
      if (
        b1 < (b0 === 0xe0 ? 0xa0 : 0x80) ||
        b1 > (b0 === 0xed ? 0x9f : 0xbf) ||
        (b2 & 0xc0) !== 0x80
      ) {
        return fallback(output, i);
      }
      output += String.fromCharCode(((b0 & 0x0f) << 12) | ((b1 & 0x3f) << 6) | (b2 & 0x3f));
      i += 3;
    } else if (b0 >= 0xf0 && b0 <= 0xf4) {
      if (i + 3 >= length) return fallback(output, i);
      const b1 = bytes[i + 1]!;
      const b2 = bytes[i + 2]!;
      const b3 = bytes[i + 3]!;
      if (
        b1 < (b0 === 0xf0 ? 0x90 : 0x80) ||
        b1 > (b0 === 0xf4 ? 0x8f : 0xbf) ||
        (b2 & 0xc0) !== 0x80 ||
        (b3 & 0xc0) !== 0x80
      ) {
        return fallback(output, i);
      }
      const codePoint =
        (((b0 & 0x07) << 18) | ((b1 & 0x3f) << 12) | ((b2 & 0x3f) << 6) | (b3 & 0x3f)) - 0x10000;
      output += String.fromCharCode((codePoint >> 10) + 0xd800, (codePoint & 0x3ff) + 0xdc00);
      i += 4;
    } else {
      return fallback(output, i);
    }
  }

  return output;
}

function decodeUTF8General(
  bytes: Uint8Array,
  state: TextDecoderState,
  stream: boolean,
  output = '',
  start = 0
): string {
  const { ignoreBOM } = state;
  let { pending, bomSeen } = state;
  let i = start;
  const length = bytes.length;

  if (pending.length > 0) {
    const b0 = pending[0]!;
    const bytesNeeded = b0 <= 0xdf ? 1 : b0 <= 0xef ? 2 : 3;
    let codePoint = b0 & (bytesNeeded === 1 ? 0x1f : bytesNeeded === 2 ? 0x0f : 0x07);
    let bytesSeen = 0;

    for (let p = 1; p < pending.length; p++) {
      codePoint = (codePoint << 6) | (pending[p]! & 0x3f);
      bytesSeen++;
    }

    while (bytesSeen < bytesNeeded && i < length) {
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
        output += decoderError(state);
        bomSeen = true;
        break;
      }
      codePoint = (codePoint << 6) | (byte & 0x3f);
      bytesSeen++;
      i++;
    }

    if (bytesSeen === bytesNeeded) {
      pending = EMPTY_BYTES;
      if (bomSeen || ignoreBOM || codePoint !== 0xfeff) {
        if (codePoint <= 0xffff) {
          output += String.fromCharCode(codePoint);
        } else {
          codePoint -= 0x10000;
          output += String.fromCharCode((codePoint >> 10) + 0xd800, (codePoint & 0x3ff) + 0xdc00);
        }
      }
      bomSeen = true;
    } else if (i === length) {
      if (stream && i > 0) {
        const nextPending = new Uint8Array(pending.length + i);
        nextPending.set(pending);
        nextPending.set(bytes.subarray(0, i), pending.length);
        pending = nextPending;
      } else if (!stream) {
        pending = EMPTY_BYTES;
        output += decoderError(state);
        bomSeen = true;
      }
    }

    if (pending.length > 0) {
      state.pending = pending;
      state.bomSeen = bomSeen;
      return output;
    }
  }

  while (i < length) {
    const b0 = bytes[i]!;
    if (b0 < 0x80) {
      bomSeen = true;
      const directEnd = Math.min(i + 32, length);
      do {
        output += String.fromCharCode(bytes[i++]!);
      } while (i < directEnd && bytes[i]! < 0x80);
      if (i === directEnd && i < length && bytes[i]! < 0x80) {
        const asciiStart = i;
        do {
          i++;
        } while (i < length && bytes[i]! < 0x80);
        output = appendASCII(output, bytes, asciiStart, i);
      }
      continue;
    }

    let codePoint: number;
    const remaining = length - i;
    if (b0 >= 0xc2 && b0 <= 0xdf) {
      if (remaining < 2) {
        if (stream) {
          pending = bytes.slice(i);
        } else {
          output += decoderError(state);
        }
        break;
      }
      const b1 = bytes[i + 1]!;
      if ((b1 & 0xc0) !== 0x80) {
        output += decoderError(state);
        bomSeen = true;
        i++;
        continue;
      }
      codePoint = ((b0 & 0x1f) << 6) | (b1 & 0x3f);
      i += 2;
    } else if (b0 >= 0xe0 && b0 <= 0xef) {
      if (remaining < 2) {
        if (stream) {
          pending = bytes.slice(i);
        } else {
          output += decoderError(state);
        }
        break;
      }
      const b1 = bytes[i + 1]!;
      if ((b1 & 0xc0) !== 0x80 || (b0 === 0xe0 && b1 < 0xa0) || (b0 === 0xed && b1 > 0x9f)) {
        output += decoderError(state);
        bomSeen = true;
        i++;
        continue;
      } else if (remaining < 3) {
        if (stream) {
          pending = bytes.slice(i);
        } else {
          output += decoderError(state);
        }
        break;
      }
      const b2 = bytes[i + 2]!;
      if ((b2 & 0xc0) !== 0x80) {
        output += decoderError(state);
        bomSeen = true;
        i += 2;
        continue;
      }
      codePoint = ((b0 & 0x0f) << 12) | ((b1 & 0x3f) << 6) | (b2 & 0x3f);
      i += 3;
    } else if (b0 >= 0xf0 && b0 <= 0xf4) {
      if (remaining < 2) {
        if (stream) {
          pending = bytes.slice(i);
        } else {
          output += decoderError(state);
        }
        break;
      }
      const b1 = bytes[i + 1]!;
      if ((b1 & 0xc0) !== 0x80 || (b0 === 0xf0 && b1 < 0x90) || (b0 === 0xf4 && b1 > 0x8f)) {
        output += decoderError(state);
        bomSeen = true;
        i++;
        continue;
      } else if (remaining < 3) {
        if (stream) {
          pending = bytes.slice(i);
        } else {
          output += decoderError(state);
        }
        break;
      }
      const b2 = bytes[i + 2]!;
      if ((b2 & 0xc0) !== 0x80) {
        output += decoderError(state);
        bomSeen = true;
        i += 2;
        continue;
      } else if (remaining < 4) {
        if (stream) {
          pending = bytes.slice(i);
        } else {
          output += decoderError(state);
        }
        break;
      }
      const b3 = bytes[i + 3]!;
      if ((b3 & 0xc0) !== 0x80) {
        output += decoderError(state);
        bomSeen = true;
        i += 3;
        continue;
      }
      codePoint = ((b0 & 0x07) << 18) | ((b1 & 0x3f) << 12) | ((b2 & 0x3f) << 6) | (b3 & 0x3f);
      i += 4;
    } else {
      output += decoderError(state);
      bomSeen = true;
      i++;
      continue;
    }

    if (bomSeen || ignoreBOM || codePoint !== 0xfeff) {
      if (codePoint <= 0xffff) {
        output += String.fromCharCode(codePoint);
      } else {
        codePoint -= 0x10000;
        output += String.fromCharCode((codePoint >> 10) + 0xd800, (codePoint & 0x3ff) + 0xdc00);
      }
    }
    bomSeen = true;
  }

  state.pending = pending;
  state.bomSeen = bomSeen;
  return output;
}

function decodeUTF8(bytes: Uint8Array, state: TextDecoderState, stream: boolean): string {
  if (state.pending.length === 0) {
    if (!stream && !state.bomSeen) {
      const skipBOM =
        !state.ignoreBOM && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? 3 : 0;
      const result = decodeUTF8Fast(bytes, skipBOM);
      if (typeof result === 'string') {
        state.bomSeen = bytes.length > 0;
        return result;
      }
      state.bomSeen = skipBOM > 0 || result.index > skipBOM;
      return decodeUTF8General(bytes, state, false, result.output, result.index);
    }
  }

  return decodeUTF8General(bytes, state, stream);
}

// @docsMissing
export class TextDecoder {
  private readonly _state: TextDecoderState;

  constructor(label: string = 'utf-8', options: { fatal?: boolean; ignoreBOM?: boolean } = {}) {
    if (options == null || (typeof options !== 'object' && typeof options !== 'function')) {
      throw new TypeError(
        'Second argument of TextDecoder must be undefined or an object, e.g. { fatal: true }'
      );
    }
    assertValidUTF8Label(label);
    this._state = {
      fatal: Boolean(options.fatal),
      ignoreBOM: Boolean(options.ignoreBOM),
      bomSeen: false,
      pending: EMPTY_BYTES,
      streaming: false,
    };
  }

  get encoding(): string {
    return 'utf-8';
  }

  get fatal(): boolean {
    return this._state.fatal;
  }

  get ignoreBOM(): boolean {
    return this._state.ignoreBOM;
  }

  decode(input?: ArrayBuffer | ArrayBufferView, options: { stream?: boolean } = {}): string {
    if (options == null || (typeof options !== 'object' && typeof options !== 'function')) {
      throw new TypeError('The options argument must be undefined or an object');
    }
    const bytes = normalizeBytes(input);
    const stream = Boolean(options.stream);
    const state = this._state;
    if (!state.streaming) {
      state.bomSeen = false;
      state.pending = EMPTY_BYTES;
    }

    try {
      const output = decodeUTF8(bytes, state, stream);
      state.streaming = stream;
      return output;
    } catch (error) {
      state.pending = EMPTY_BYTES;
      state.streaming = false;
      throw error;
    }
  }
}
