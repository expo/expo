describe('TextEncoderStream', () => {
  function createTextStreamFromChunks(chunks: string[]) {
    return new ReadableStream({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(chunk);
        }
        controller.close();
      },
    });
  }

  it(`uses the Expo built-in APIs`, () => {
    expect((TextEncoderStream as any)[Symbol.for('expo.builtin')]).toBe(true);
  });

  it('has expected attributes', () => {
    const stream = new TextEncoderStream();
    expect('readable' in stream).toBe(true);
    expect('writable' in stream).toBe(true);
    // Unlike TextDecoderStream, there are no encoding/fatal/ignoreBOM props
  });

  it('encodes a simple string stream into UTF-8 bytes', async () => {
    const stream = createTextStreamFromChunks(['Hello, world!']);
    const encoderStream = new TextEncoderStream();

    const reader = stream.pipeThrough(encoderStream).getReader();

    const { value, done } = await reader.read();

    expect(done).toBe(false);
    expect(value).toBeInstanceOf(Uint8Array);
    expect(new TextDecoder().decode(value)).toBe('Hello, world!');
  });

  it('encodes multiple string chunks to valid UTF-8', async () => {
    const parts = ['Hel', 'lo ', '🌍']; // emoji = 4-byte sequence
    const stream = createTextStreamFromChunks(parts);
    const reader = stream.pipeThrough(new TextEncoderStream()).getReader();

    const decodedChunks: string[] = [];

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      decodedChunks.push(new TextDecoder().decode(value));
    }

    expect(decodedChunks.join('')).toBe('Hello 🌍');
  });

  it('supports encoding empty string', async () => {
    const stream = createTextStreamFromChunks(['']);
    const reader = stream.pipeThrough(new TextEncoderStream()).getReader();

    const { value, done } = await reader.read();
    expect(value?.length).toBe(undefined);
    expect(done).toBe(true);
  });

  it('resolves with done: true after end of stream', async () => {
    const stream = createTextStreamFromChunks(['final']);
    const reader = stream.pipeThrough(new TextEncoderStream()).getReader();

    await reader.read(); // consume value
    const final = await reader.read(); // should be done

    expect(final.done).toBe(true);
    expect(final.value).toBeUndefined();
  });

  it('encodes surrogate pairs correctly', async () => {
    const stream = createTextStreamFromChunks(['𝄞']); // G-clef U+1D11E
    const reader = stream.pipeThrough(new TextEncoderStream()).getReader();

    const { value } = await reader.read();

    expect(new TextDecoder().decode(value)).toBe('𝄞');
  });
});
