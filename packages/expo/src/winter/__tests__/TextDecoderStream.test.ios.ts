describe('TextDecoderStream', () => {
  it(`uses the Expo built-in APIs`, () => {
    expect((TextDecoder as any)[Symbol.for('expo.builtin')]).toBe(true);
    expect((TextDecoderStream as any)[Symbol.for('expo.builtin')]).toBe(true);
  });

  it('has expected attributes', () => {
    const stream = new TextDecoderStream();
    expect('readable' in stream).toBe(true);
    expect('writable' in stream).toBe(true);
    expect('encoding' in stream).toBe(true);
    expect(stream.encoding).toBe('utf-8');
    expect('fatal' in stream).toBe(true);
    expect(stream.fatal).toBe(false);
    expect('ignoreBOM' in stream).toBe(true);
    expect(stream.ignoreBOM).toBe(false);
  });

  it('respects constructor options', () => {
    const stream = new TextDecoderStream('utf-8', { fatal: true, ignoreBOM: true });
    expect(stream.encoding).toBe('utf-8');
    expect(stream.fatal).toBe(true);
    expect(stream.ignoreBOM).toBe(true);
  });

  describe('supports utf8 labels', () => {
    [
      'unicode-1-1-utf-8',
      'unicode11utf8',
      'unicode20utf8',
      'utf-8',
      'utf8',
      'x-unicode20utf8',
      '  UTF-8  ',
      ' X-uNIcode20utF8',
    ].forEach((label) => {
      it(`should return utf-8 for label ${label}`, () => {
        const stream = new TextDecoderStream(label);
        expect(stream.encoding).toBe('utf-8');
      });
    });
  });

  it('should decode a UTF-8 stream into text', async () => {
    // Encode some UTF-8 text into a stream
    const encoder = new TextEncoder();
    const encoded = encoder.encode('Hello, world!');

    // Create a readable stream from encoded bytes
    const byteStream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoded);
        controller.close();
      },
    });

    // Pipe through TextDecoderStream
    const decoder = new TextDecoderStream();

    const decodedStream = byteStream.pipeThrough(decoder);

    // Read the decoded string
    const reader = decodedStream.getReader();
    const { value, done } = await reader.read();

    expect(done).toBe(false);
    expect(value).toBe('Hello, world!');
  });

  it('should insert replacement characters for bad data when fatal is false', async () => {
    // Malformed UTF-8 byte sequence (e.g., 0xC3 followed by invalid byte 0x28)
    const badBytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0xc3, 0x28]); // "Hello " + invalid

    const byteStream = new ReadableStream({
      start(controller) {
        controller.enqueue(badBytes);
        controller.close();
      },
    });

    // Default is fatal: false
    const decoder = new TextDecoderStream('utf-8', { fatal: false });

    const decodedStream = byteStream.pipeThrough(decoder);

    const reader = decodedStream.getReader();
    const { value, done } = await reader.read();

    expect(done).toBe(false);
    expect(value).toBe('Hello �('); // Invalid sequence replaced with �
  });

  function createStreamFromChunks(chunks: Uint8Array[]) {
    return new ReadableStream({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(chunk);
        }
        controller.close();
      },
    });
  }

  it('decodes simple UTF-8 text', async () => {
    const text = 'Hello, world!';
    const encoded = new TextEncoder().encode(text);

    const stream = createStreamFromChunks([encoded]);

    const reader = stream.pipeThrough(new TextDecoderStream()).getReader();

    const { value, done } = await reader.read();
    expect(value).toBe(text);
    expect(done).toBe(false);
  });

  it('handles multi-byte characters split across chunks', async () => {
    const euro = new TextEncoder().encode('€'); // 0xE2 0x82 0xAC
    const chunks = [euro.slice(0, 1), euro.slice(1)]; // split across chunks

    const stream = createStreamFromChunks(chunks);

    const reader = stream.pipeThrough(new TextDecoderStream()).getReader();

    const { value } = await reader.read();
    expect(value).toBe('€');
  });

  it('replaces malformed UTF-8 with replacement char when fatal: false', async () => {
    const badBytes = new Uint8Array([0xe2, 0x28]); // malformed

    const stream = createStreamFromChunks([badBytes]);

    const reader = stream.pipeThrough(new TextDecoderStream('utf-8', { fatal: false })).getReader();

    const { value } = await reader.read();
    expect(value).toContain('�');
  });

  it('throws on malformed UTF-8 when fatal: true', async () => {
    const badBytes = new Uint8Array([0xe2, 0x28]);

    const stream = createStreamFromChunks([badBytes]);
    const decoder = new TextDecoderStream('utf-8', { fatal: true });

    const reader = stream.pipeThrough(decoder).getReader();

    await expect(reader.read()).rejects.toThrow(TypeError);
  });

  it('respects ignoreBOM: true (preserves BOM)', async () => {
    const withBOM = new Uint8Array([0xef, 0xbb, 0xbf, 0x48, 0x69]);

    const stream = createStreamFromChunks([withBOM]);
    const decoderStream = new TextDecoderStream('utf-8', { ignoreBOM: true });

    const reader = stream.pipeThrough(decoderStream).getReader();

    const { value } = await reader.read();
    expect(value).toBe('\uFEFFHi');
    expect(value?.charCodeAt(0)).toBe(0xfeff);
  });

  it('respects ignoreBOM: false (strips BOM)', async () => {
    const withBOM = new Uint8Array([0xef, 0xbb, 0xbf, 0x48, 0x69]); // BOM + "Hi"

    const stream = createStreamFromChunks([withBOM]);
    const decoderStream = new TextDecoderStream('utf-8', { ignoreBOM: false });

    const reader = stream.pipeThrough(decoderStream).getReader();

    const { value } = await reader.read();
    expect(value).toBe('Hi');
    expect(value?.charCodeAt(0)).not.toBe(0xfeff);
  });

  it('handles UTF-8 BOM when ignoreBOM: true', async () => {
    const utf8BOM = new Uint8Array([0xef, 0xbb, 0xbf]); // BOM
    const message = new TextEncoder().encode('Hi');
    const bytes = new Uint8Array([...utf8BOM, ...message]);

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(bytes);
        controller.close();
      },
    });

    const decoder = new TextDecoderStream('utf-8', { ignoreBOM: true });

    const reader = stream.pipeThrough(decoder).getReader();

    const { value, done } = await reader.read();

    // BOM is preserved
    expect(value).toBe('\uFEFFHi');
    expect(value?.charCodeAt(0)).toBe(0xfeff); // ✅ not "not.toBe"
    expect(done).toBe(false);
  });

  it('preserves UTF-8 BOM when ignoreBOM: false', async () => {
    const withBOM = new Uint8Array([0xef, 0xbb, 0xbf, 0x48, 0x69]); // BOM + "Hi"

    const stream = createStreamFromChunks([withBOM]);
    const reader = stream

      .pipeThrough(new TextDecoderStream('utf-8', { ignoreBOM: false }))
      .getReader();

    const { value } = await reader.read();
    expect(value).toBe('Hi'); // ✅
  });

  it('works with multiple chunk reads', async () => {
    const parts = ['Hel', 'lo', ' ', '🌍']; // multi-byte emoji
    const encodedChunks = parts.map((p) => new TextEncoder().encode(p));

    const stream = createStreamFromChunks(encodedChunks);

    const reader = stream.pipeThrough(new TextDecoderStream()).getReader();

    let fullText = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      fullText += value;
    }

    expect(fullText).toBe('Hello 🌍');
  });

  it('supports utf-8 encoding as required by spec', async () => {
    const encoded = new TextEncoder().encode('Spec compliant!');
    const stream = createStreamFromChunks([encoded]);

    const reader = stream.pipeThrough(new TextDecoderStream('utf-8')).getReader();
    const { value } = await reader.read();

    expect(value).toBe('Spec compliant!');
  });

  it('resolves with done: true after end of stream', async () => {
    const encoded = new TextEncoder().encode('done');
    const stream = createStreamFromChunks([encoded]);

    const reader = stream.pipeThrough(new TextDecoderStream()).getReader();
    await reader.read(); // consume value
    const final = await reader.read(); // should be done

    expect(final.done).toBe(true);
    expect(final.value).toBeUndefined();
  });
});
