// https://encoding.spec.whatwg.org/#interface-textdecoderstream
export class TextDecoderStream extends TransformStream<Uint8Array | ArrayBuffer, string> {
  private decoder: TextDecoder;

  constructor(label?: string, options?: TextDecoderOptions) {
    const decoder = new TextDecoder(label, options);
    super({
      transform(
        chunk: ArrayBuffer | Uint8Array,
        controller: TransformStreamDefaultController<string>
      ) {
        try {
          const text = decoder.decode(chunk, { stream: true });
          if (text) controller.enqueue(text);
        } catch (e: unknown) {
          controller.error(e);
        }
      },
      flush(controller: TransformStreamDefaultController<string>) {
        try {
          const text = decoder.decode();
          if (text) controller.enqueue(text);
        } catch (e: unknown) {
          controller.error(e);
        }
      },
    });
    this.decoder = decoder;
  }

  get encoding() {
    return this.decoder.encoding;
  }

  get fatal() {
    return this.decoder.fatal;
  }

  get ignoreBOM() {
    return this.decoder.ignoreBOM;
  }
}

// https://encoding.spec.whatwg.org/#interface-textencoderstream
export class TextEncoderStream extends TransformStream {
  private encoder: TextEncoder;

  constructor() {
    const encoder = new TextEncoder();
    let carry: string | undefined;
    super({
      transform(chunk: string, controller: TransformStreamDefaultController<Uint8Array>) {
        chunk = String(chunk);
        if (carry !== undefined) {
          chunk = carry + chunk;
          carry = undefined;
        }

        const lastCharIndex = chunk.length - 1;
        const lastCodeUnit = chunk.charCodeAt(lastCharIndex);
        if (lastCodeUnit >= 0xd800 && lastCodeUnit < 0xdc00) {
          carry = String.fromCharCode(lastCodeUnit);
          chunk = chunk.substring(0, lastCharIndex);
        }

        const encoded = encoder.encode(chunk);
        if (encoded.length) {
          try {
            controller.enqueue(encoded);
          } catch (e: unknown) {
            controller.error(e);
          }
        }
      },

      flush(controller: TransformStreamDefaultController<Uint8Array>) {
        if (carry !== undefined) {
          try {
            controller.enqueue(encoder.encode(carry));
          } catch (e: unknown) {
            controller.error(e);
          } finally {
            carry = undefined;
          }
        }
      },
    });
    this.encoder = encoder;
  }

  get encoding() {
    return this.encoder.encoding;
  }
}
