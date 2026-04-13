import { createDocumentMetadataInjectionTransform } from '../streams';

async function readStream(stream: ReadableStream<Uint8Array>): Promise<string> {
  return await new Response(stream).text();
}

function createStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
}

describe(createDocumentMetadataInjectionTransform, () => {
  it('injects head content and document attributes before streaming the rest of the response', async () => {
    const stream = createStream([
      '<!DOCTYPE html><html><head><title>Test</title>',
      '</head><body><div>hello</div></body></html>',
    ]).pipeThrough(
      createDocumentMetadataInjectionTransform({
        injectionParts: ['<meta name="expo" content="1">'],
        htmlAttributes: 'lang="en"',
        bodyAttributes: 'class="dark"',
      })
    );

    await expect(readStream(stream)).resolves.toBe(
      '<!DOCTYPE html><html lang="en"><head><title>Test</title><meta name="expo" content="1"></head><body class="dark"><div>hello</div></body></html>'
    );
  });

  it('appends html and body attributes when the tags already have attributes', async () => {
    const stream = createStream([
      '<!DOCTYPE html><html data-theme="light"><head><title>Test</title></head>',
      '<body data-route="/"><div>hello</div></body></html>',
    ]).pipeThrough(
      createDocumentMetadataInjectionTransform({
        injectionParts: ['<meta name="expo" content="1">'],
        htmlAttributes: 'lang="en"',
        bodyAttributes: 'class="dark"',
      })
    );

    await expect(readStream(stream)).resolves.toBe(
      '<!DOCTYPE html><html lang="en" data-theme="light"><head><title>Test</title><meta name="expo" content="1"></head><body class="dark" data-route="/"><div>hello</div></body></html>'
    );
  });

  it('handles chunk boundaries that split the head close tag and body open tag', async () => {
    const stream = createStream([
      '<!DOCTYPE html><html><head><title>Test</title></he',
      'ad><bo',
      'dy><div>hello</div></body></html>',
    ]).pipeThrough(
      createDocumentMetadataInjectionTransform({
        injectionParts: ['<meta name="expo" content="1">'],
        htmlAttributes: 'lang="en"',
        bodyAttributes: 'class="dark"',
      })
    );

    await expect(readStream(stream)).resolves.toBe(
      '<!DOCTYPE html><html lang="en"><head><title>Test</title><meta name="expo" content="1"></head><body class="dark"><div>hello</div></body></html>'
    );
  });

  it('injects head content when no document attributes are provided', async () => {
    const stream = createStream([
      '<!DOCTYPE html><html><head><title>Test</title></head><body><div>hello</div></body></html>',
    ]).pipeThrough(
      createDocumentMetadataInjectionTransform({
        injectionParts: ['<meta name="expo" content="1">'],
        htmlAttributes: '',
        bodyAttributes: '',
      })
    );

    await expect(readStream(stream)).resolves.toBe(
      '<!DOCTYPE html><html><head><title>Test</title><meta name="expo" content="1"></head><body><div>hello</div></body></html>'
    );
  });

  it('fails when the response never emits a closing head tag', async () => {
    const stream = createStream([
      '<!DOCTYPE html><html><head><title>Test</title><body>',
    ]).pipeThrough(
      createDocumentMetadataInjectionTransform({
        injectionParts: ['<meta name="expo" content="1">'],
      })
    );

    await expect(readStream(stream)).rejects.toThrow(
      'Streaming SSR head injection failed: missing </head> in HTML output.'
    );
  });
});
