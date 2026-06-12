import {
  createDocumentMetadataInjectionTransform,
  createServerInsertedHTMLTransform,
} from '../streams';

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

describe(createServerInsertedHTMLTransform, () => {
  function drainOnce(insertion: string): () => string {
    let drained = false;
    return () => {
      if (drained) return '';
      drained = true;
      return insertion;
    };
  }

  it('splices the first insertion before the closing head tag', async () => {
    const stream = createStream([
      '<!DOCTYPE html><html><head><title>Test</title></head><body><div>hello</div></body></html>',
    ]).pipeThrough(createServerInsertedHTMLTransform(drainOnce('<script>first()</script>')));

    await expect(readStream(stream)).resolves.toBe(
      '<!DOCTYPE html><html><head><title>Test</title><script>first()</script></head><body><div>hello</div></body></html>'
    );
  });

  it('drains the inserted HTML once per emitted flush, before the React chunk of that flush', async () => {
    const insertions = ['<script>shell()</script>', '<script>boundary()</script>', ''];
    let drainCount = 0;

    const stream = createStream([
      '<!DOCTYPE html><html><head><title>Test</title></head><body><div>shell</div>',
      '<div hidden>boundary content</div><script>$RC("B:0","S:0")</script>',
      '</body></html>',
    ]).pipeThrough(createServerInsertedHTMLTransform(() => insertions[drainCount++] ?? ''));

    await expect(readStream(stream)).resolves.toBe(
      '<!DOCTYPE html><html><head><title>Test</title><script>shell()</script></head><body><div>shell</div>' +
        '<script>boundary()</script><div hidden>boundary content</div><script>$RC("B:0","S:0")</script>' +
        '</body></html>'
    );
  });

  it('emits a final insertion when content arrives only after the last React chunk', async () => {
    const insertions = ['', '', '<script>late()</script>'];
    let drainCount = 0;

    const stream = createStream([
      '<!DOCTYPE html><html><head></head><body>',
      '</body></html>',
    ]).pipeThrough(createServerInsertedHTMLTransform(() => insertions[drainCount++] ?? ''));

    await expect(readStream(stream)).resolves.toBe(
      '<!DOCTYPE html><html><head></head><body></body></html><script>late()</script>'
    );
  });

  it('passes chunks through untouched when no HTML is inserted', async () => {
    const stream = createStream([
      '<!DOCTYPE html><html><head></head><body><div>a</div>',
      '<div>b</div>',
      '</body></html>',
    ]).pipeThrough(createServerInsertedHTMLTransform(() => ''));

    await expect(readStream(stream)).resolves.toBe(
      '<!DOCTYPE html><html><head></head><body><div>a</div><div>b</div></body></html>'
    );
  });

  it('buffers until the closing head tag even when it is split across chunks', async () => {
    const stream = createStream([
      '<!DOCTYPE html><html><head><title>Test</title></he',
      'ad><body><div>hello</div>',
      '</body></html>',
    ]).pipeThrough(createServerInsertedHTMLTransform(drainOnce('<script>first()</script>')));

    await expect(readStream(stream)).resolves.toBe(
      '<!DOCTYPE html><html><head><title>Test</title><script>first()</script></head><body><div>hello</div>' +
        '</body></html>'
    );
  });

  it('passes buffered output through when the head never completes', async () => {
    const stream = createStream(['<!DOCTYPE html><html><head><title>Aborted', '...']).pipeThrough(
      createServerInsertedHTMLTransform(() => '')
    );

    await expect(readStream(stream)).resolves.toBe('<!DOCTYPE html><html><head><title>Aborted...');
  });

  it('discards pending insertions when the head never completes', async () => {
    const stream = createStream(['<!DOCTYPE html><html><head><title>Aborted']).pipeThrough(
      createServerInsertedHTMLTransform(() => '<script>pending()</script>')
    );

    await expect(readStream(stream)).resolves.toBe('<!DOCTYPE html><html><head><title>Aborted');
  });
});
