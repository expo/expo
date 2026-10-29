import { useServerDocumentContext } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

import {
  injectDocumentAttributes,
  injectDocumentAttributesIntoStream,
  renderDocumentTemplate,
  type DocumentTemplate,
} from '../renderDocument';

function Template({ children }: PropsWithChildren) {
  const { headNodes, bodyNodes } = useServerDocumentContext();
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        {headNodes}
      </head>
      <body className="app" data-theme="dark">
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}

const options = {
  pathname: '/',
  params: {},
  headNodes: [<meta key="viewport" name="viewport" content="width=device-width" />],
  source: './+html.tsx',
};

describe(renderDocumentTemplate, () => {
  it('reads the attributes and the head content from the template', () => {
    expect(renderDocumentTemplate(Template, options)).toEqual({
      htmlAttributes: ' lang="en" class="dark"',
      headHtml: '<meta charSet="utf-8"/><meta name="viewport" content="width=device-width"/>',
      bodyAttributes: ' class="app" data-theme="dark"',
      hasBodyNodes: true,
      bodyExtrasHtml: '',
    });
  });

  it('reports a template without bodyNodes', () => {
    function WithoutBodyNodes({ children }: PropsWithChildren) {
      return (
        <html>
          <body>{children}</body>
        </html>
      );
    }
    expect(renderDocumentTemplate(WithoutBodyNodes, options)).toEqual({
      htmlAttributes: '',
      headHtml: '',
      bodyAttributes: '',
      hasBodyNodes: false,
      bodyExtrasHtml: '',
    });
  });

  it('keeps other body elements and warns once', () => {
    function WithExtras({ children }: PropsWithChildren) {
      const { bodyNodes } = useServerDocumentContext();
      return (
        <html>
          <head />
          <body>
            <noscript>Enable JavaScript</noscript>
            {children}
            {bodyNodes}
            <div id="portal" />
          </body>
        </html>
      );
    }
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      expect(renderDocumentTemplate(WithExtras, options).bodyExtrasHtml).toBe(
        '<noscript>Enable JavaScript</noscript><div id="portal"></div>'
      );
      renderDocumentTemplate(WithExtras, options);
      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleWarn).toHaveBeenCalledWith(
        'The root HTML component "./+html.tsx" renders elements inside <body> other than its children prop and bodyNodes. Expo Router keeps them in a <div style="display: contents"> after the app, so the server and the browser render the same document. Move them into the root layout, or into <head>.'
      );
    } finally {
      consoleWarn.mockRestore();
    }
  });

  it('does not read a header element as the head', () => {
    function WithHeader({ children }: PropsWithChildren) {
      return (
        <html>
          <body>
            <header>Site</header>
            {children}
          </body>
        </html>
      );
    }
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      expect(renderDocumentTemplate(WithHeader, options)).toEqual({
        htmlAttributes: '',
        headHtml: '',
        bodyAttributes: '',
        hasBodyNodes: false,
        bodyExtrasHtml: '<header>Site</header>',
      });
    } finally {
      consoleWarn.mockRestore();
    }
  });

  it('throws when the template does not render its children', () => {
    function WithoutChildren() {
      return (
        <html>
          <body />
        </html>
      );
    }
    expect(() => renderDocumentTemplate(WithoutChildren, options)).toThrow(
      'The root HTML component "./+html.tsx" did not render its children prop inside <body>. The app has no place in the document without it.'
    );
  });

  it('throws when the template does not render an html element', () => {
    function WithoutHtml({ children }: PropsWithChildren) {
      return <div>{children}</div>;
    }
    expect(() => renderDocumentTemplate(WithoutHtml, options)).toThrow(
      'The root HTML component "./+html.tsx" did not render an <html> element. It must render <html>, <head>, and <body>, and render its children prop inside <body>.'
    );
  });
});

const template: DocumentTemplate = {
  htmlAttributes: ' lang="fr"',
  headHtml: '',
  bodyAttributes: ' class="app"',
  hasBodyNodes: true,
  bodyExtrasHtml: '',
};

const document =
  '<!DOCTYPE html><html><head><title>Café</title></head><body><div id="root">Été</div></body></html>';

describe(injectDocumentAttributes, () => {
  it('adds the html and body attributes', () => {
    expect(injectDocumentAttributes(document, template)).toBe(
      '<!DOCTYPE html><html lang="fr"><head><title>Café</title></head><body class="app"><div id="root">Été</div></body></html>'
    );
  });
});

describe(injectDocumentAttributesIntoStream, () => {
  function streamOf(chunks: Uint8Array[]) {
    return new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(chunk);
        }
        controller.close();
      },
    });
  }

  it('adds the attributes when the body tag is split across chunks', async () => {
    const bytes = new TextEncoder().encode(document);
    // Split inside `é` of `Café` (a two-byte character) and inside `<body>`.
    const cafeIndex = document.indexOf('é') + 1;
    const bodyIndex = document.indexOf('<body>') + 3;
    const stream = injectDocumentAttributesIntoStream(
      streamOf([
        bytes.subarray(0, cafeIndex),
        bytes.subarray(cafeIndex, bodyIndex),
        bytes.subarray(bodyIndex),
      ]),
      template
    );
    expect(await new Response(stream).text()).toBe(
      '<!DOCTYPE html><html lang="fr"><head><title>Café</title></head><body class="app"><div id="root">Été</div></body></html>'
    );
  });

  it('returns the stream unchanged when the template has no attributes', () => {
    const stream = streamOf([]);
    expect(
      injectDocumentAttributesIntoStream(stream, {
        ...template,
        htmlAttributes: '',
        bodyAttributes: '',
      })
    ).toBe(stream);
  });
});
