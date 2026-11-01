/**
 * Copyright © 2026 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { ServerDocument } from 'expo-router/internal/server';
import React, { createContext, use, type ComponentType, type ReactNode } from 'react';
import ReactDOMServer from 'react-dom/server';

const CHILDREN_MARKER = '<expo-router-children></expo-router-children>';
const BODY_NODES_MARKER = '<expo-router-body-nodes></expo-router-body-nodes>';

export type DocumentTemplate = {
  /** The attributes of `<html>` as rendered by `+html`, with a leading space, or an empty string. */
  htmlAttributes: string;
  /** The inner HTML of `<head>` as rendered by `+html`. */
  headHtml: string;
  /** The attributes of `<body>` as rendered by `+html`, with a leading space, or an empty string. */
  bodyAttributes: string;
  /** Whether `+html` renders `bodyNodes`. Without them, the page does not hydrate. */
  hasBodyNodes: boolean;
  /** Body markup from `+html` other than `children` and `bodyNodes`. */
  bodyExtrasHtml: string;
};

type RenderDocumentTemplateOptions = {
  pathname: string;
  params: Record<string, string | string[] | undefined>;
  headNodes: ReactNode[];
  /** The `+html` module key, for error and warning messages. */
  source: string;
};

/**
 * Renders the `+html` component once, to static markup, and reads the document pieces from it.
 * The component runs on the server only, as the docs promise, and the app is never its child.
 */
export function renderDocumentTemplate(
  Root: ComponentType<any>,
  { pathname, params, headNodes, source }: RenderDocumentTemplateOptions
): DocumentTemplate {
  const markup = ReactDOMServer.renderToStaticMarkup(
    <ServerDocument data={{ headNodes, bodyNodes: React.createElement('expo-router-body-nodes') }}>
      <Root pathname={pathname} params={params}>
        {React.createElement('expo-router-children')}
      </Root>
    </ServerDocument>
  );

  const html = readTag(markup, 'html', 0);
  if (!html) {
    throw new Error(
      `The root HTML component "${source}" did not render an <html> element. It must render <html>, <head>, and <body>, and render its children prop inside <body>.`
    );
  }
  const head = readTag(markup, 'head', html.contentStart);
  const body = readTag(markup, 'body', head ? head.contentEnd : html.contentStart);
  if (!body) {
    throw new Error(
      `The root HTML component "${source}" did not render a <body> element. It must render its children prop inside <body>.`
    );
  }

  const bodyHtml = markup.slice(body.contentStart, body.contentEnd);
  const childrenIndex = bodyHtml.indexOf(CHILDREN_MARKER);
  if (childrenIndex === -1) {
    throw new Error(
      `The root HTML component "${source}" did not render its children prop inside <body>. The app has no place in the document without it.`
    );
  }
  const hasBodyNodes = bodyHtml.includes(BODY_NODES_MARKER);
  const bodyExtrasHtml = bodyHtml
    .replace(CHILDREN_MARKER, '')
    .replace(BODY_NODES_MARKER, '')
    .trim();
  if (bodyExtrasHtml) {
    warnAboutBodyExtras(source);
  }

  return {
    htmlAttributes: html.attributes,
    headHtml: head ? markup.slice(head.contentStart, head.contentEnd) : '',
    bodyAttributes: body.attributes,
    hasBodyNodes,
    bodyExtrasHtml,
  };
}

let didWarnAboutBodyExtras = false;

function warnAboutBodyExtras(source: string) {
  if (didWarnAboutBodyExtras) {
    return;
  }
  didWarnAboutBodyExtras = true;
  console.warn(
    `The root HTML component "${source}" renders elements inside <body> other than its children prop and bodyNodes. Expo Router keeps them in a <div style="display: contents"> after the app, so the server and the browser render the same document. Move them into the root layout, or into <head>.`
  );
}

type Tag = {
  attributes: string;
  contentStart: number;
  contentEnd: number;
};

/** Finds the first `<name ...>...</name>` element at or after `from` in React static markup. */
function readTag(markup: string, name: string, from: number): Tag | null {
  let start = markup.indexOf(`<${name}`, from);
  // `<head` also matches `<header`. Skip a match that continues the tag name.
  while (start !== -1 && !/[\s>]/.test(markup[start + name.length + 1] ?? '')) {
    start = markup.indexOf(`<${name}`, start + 1);
  }
  if (start === -1) {
    return null;
  }
  // React escapes `>` inside attribute values, so the first `>` closes the tag.
  const contentStart = markup.indexOf('>', start) + 1;
  const contentEnd = markup.lastIndexOf(`</${name}>`);
  if (contentStart === 0 || contentEnd < contentStart) {
    return null;
  }
  return {
    attributes: markup.slice(start + name.length + 1, contentStart - 1),
    contentStart,
    contentEnd,
  };
}

type HtmlDocumentContextValue = {
  template: DocumentTemplate;
  bodyNodes: ReactNode[];
};

export const HtmlDocumentContext = createContext<HtmlDocumentContextValue | null>(null);

/**
 * The document that the streaming renderer renders around the app. The browser hydrates the
 * whole document with the same element shape: `<html>` has `[head, body]`, `<body>` has
 * `[root, tail]`. `useId` depends on these two arrays. Keep the children of `<html>` and `<body>`
 * as they are.
 */
export function HtmlDocument({ children }: { children: ReactNode }) {
  const value = use(HtmlDocumentContext);
  if (!value) {
    throw new Error('HtmlDocument must render inside HtmlDocumentContext.');
  }
  const { template, bodyNodes } = value;
  return (
    <html>
      <head dangerouslySetInnerHTML={{ __html: template.headHtml }} />
      <body>
        <div id="root">{children}</div>
        <>
          {template.hasBodyNodes ? bodyNodes : null}
          {template.bodyExtrasHtml ? (
            <div
              style={{ display: 'contents' }}
              dangerouslySetInnerHTML={{ __html: template.bodyExtrasHtml }}
            />
          ) : null}
        </>
      </body>
    </html>
  );
}

// The streaming renderer writes these exact strings for `HtmlDocument`, which has no attributes
// on `<html>` and `<body>`.
const HTML_OPEN = '<html>';
const BODY_OPEN = '</head><body>';

/** Adds the `<html>` and `<body>` attributes from `+html` to the rendered document. */
export function injectDocumentAttributes(html: string, template: DocumentTemplate): string {
  if (template.htmlAttributes) {
    html = html.replace(HTML_OPEN, `<html${template.htmlAttributes}>`);
  }
  if (template.bodyAttributes) {
    html = html.replace(BODY_OPEN, `</head><body${template.bodyAttributes}>`);
  }
  return html;
}

const BODY_OPEN_BYTES = new TextEncoder().encode(BODY_OPEN);

/**
 * Adds the `<html>` and `<body>` attributes to a streamed document. The chunks up to and
 * including `<body>` are held and rewritten together, so a chunk boundary inside a tag or a
 * multi-byte character does not matter. `<body>` ends with an ASCII byte, so the held bytes are
 * complete UTF-8. Later chunks pass through unchanged.
 */
export function injectDocumentAttributesIntoStream(
  stream: ReadableStream<Uint8Array>,
  template: DocumentTemplate
): ReadableStream<Uint8Array> {
  if (!template.htmlAttributes && !template.bodyAttributes) {
    return stream;
  }
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let held: Uint8Array = new Uint8Array(0);
  let done = false;

  function rewrite(bytes: Uint8Array): Uint8Array {
    return encoder.encode(injectDocumentAttributes(decoder.decode(bytes), template));
  }

  return stream.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        if (done) {
          controller.enqueue(chunk);
          return;
        }
        held = concat(held, chunk);
        const end = indexOfBytes(held, BODY_OPEN_BYTES);
        if (end === -1) {
          return;
        }
        done = true;
        const splitAt = end + BODY_OPEN_BYTES.length;
        controller.enqueue(rewrite(held.subarray(0, splitAt)));
        if (splitAt < held.length) {
          controller.enqueue(held.subarray(splitAt));
        }
        held = new Uint8Array(0);
      },
      flush(controller) {
        if (!done && held.length > 0) {
          controller.enqueue(rewrite(held));
        }
      },
    })
  );
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  if (a.length === 0) {
    return b;
  }
  const result = new Uint8Array(a.length + b.length);
  result.set(a, 0);
  result.set(b, a.length);
  return result;
}

function indexOfBytes(haystack: Uint8Array, needle: Uint8Array): number {
  outer: for (let i = 0; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) {
        continue outer;
      }
    }
    return i;
  }
  return -1;
}
