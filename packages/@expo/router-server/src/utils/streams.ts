const HEAD_CLOSE_TAG = '</head>';
const BODY_OPEN_TAG = '<body';

type HeadInjectionOptions = {
  injectionParts: string[];
  htmlAttributes?: string;
  bodyAttributes?: string;
};

function injectTagAttributes(html: string, tagName: 'html' | 'body', attributes?: string): string {
  if (!attributes) {
    return html;
  }

  const bareTag = `<${tagName}>`;
  if (html.includes(bareTag)) {
    return html.replace(bareTag, `<${tagName} ${attributes}>`);
  }

  return html.replace(`<${tagName} `, `<${tagName} ${attributes} `);
}

/**
 * Buffers the initial HTML document prefix, injects head content plus any serialized document
 * attributes, then switches to passthrough mode for the rest of the stream.
 */
export function createDocumentMetadataInjectionTransform(
  options: HeadInjectionOptions
): TransformStream<Uint8Array, Uint8Array> {
  let buffer = '';
  let injected = false;
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const injection = options.injectionParts.join('');

  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller): void {
      const decodedChunk = decoder.decode(chunk, { stream: true });

      if (injected) {
        controller.enqueue(encoder.encode(decodedChunk));
        return;
      }

      buffer += decodedChunk;

      const headCloseIdx = buffer.indexOf(HEAD_CLOSE_TAG);
      const bodyOpenIdx = options.bodyAttributes ? buffer.indexOf(BODY_OPEN_TAG) : 0;
      const hasRequiredDocumentPrefix = headCloseIdx !== -1 && bodyOpenIdx !== -1;
      if (hasRequiredDocumentPrefix) {
        const bodyOpenTagEndIdx = options.bodyAttributes
          ? buffer.indexOf('>', bodyOpenIdx)
          : headCloseIdx + HEAD_CLOSE_TAG.length;

        if (bodyOpenTagEndIdx === -1) {
          return;
        }

        let before = buffer.slice(0, headCloseIdx);
        const afterHead = buffer.slice(headCloseIdx, bodyOpenTagEndIdx + 1);
        const remainder = buffer.slice(bodyOpenTagEndIdx + 1);
        before = injectTagAttributes(before, 'html', options.htmlAttributes);
        const documentPrefix = injectTagAttributes(afterHead, 'body', options.bodyAttributes);
        injected = true;
        buffer = '';
        controller.enqueue(encoder.encode(before + injection + documentPrefix + remainder));
      }
    },

    flush(controller): void {
      const trailing = decoder.decode();
      if (trailing) {
        if (injected) {
          controller.enqueue(encoder.encode(trailing));
          return;
        }
        buffer += trailing;
      }

      if (!injected) {
        controller.error(
          new Error(
            `Streaming SSR head injection failed: missing ${HEAD_CLOSE_TAG} in HTML output.`
          )
        );
      }
    },
  });
}

/**
 * Injects dynamically-rendered HTML into the stream at React flush boundaries, for
 * `useServerInsertedHTML()` support. `getInsertedHTML()` drains the HTML produced by the
 * currently registered callbacks and is invoked once per emitted flush:
 *
 * - The first injection is spliced in before `</head>` (buffering until the document head
 *   is complete, which React emits with the shell).
 * - Each subsequent injection is emitted immediately before the React chunk for that flush,
 *   so transported data is available before React's inline scripts reveal the Suspense
 *   content of the same flush.
 * - A final injection is drained when the stream ends.
 */
export function createServerInsertedHTMLTransform(
  getInsertedHTML: () => string
): TransformStream<Uint8Array, Uint8Array> {
  let buffer = '';
  let headInjected = false;
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller): void {
      const decodedChunk = decoder.decode(chunk, { stream: true });

      if (headInjected) {
        const insertion = getInsertedHTML();
        if (insertion) {
          controller.enqueue(encoder.encode(insertion));
        }
        controller.enqueue(encoder.encode(decodedChunk));
        return;
      }

      buffer += decodedChunk;

      // Buffering only lasts until the document head completes, which React emits
      // as part of the shell, so the first emit is not meaningfully delayed.
      const headCloseIdx = buffer.indexOf(HEAD_CLOSE_TAG);
      if (headCloseIdx === -1) {
        return;
      }

      const insertion = getInsertedHTML();
      headInjected = true;
      const output = buffer.slice(0, headCloseIdx) + insertion + buffer.slice(headCloseIdx);
      buffer = '';
      controller.enqueue(encoder.encode(output));
    },

    flush(controller): void {
      const trailing = decoder.decode();

      if (!headInjected) {
        // The head never completed (e.g. the render was aborted before the shell was
        // emitted). Pass the buffered output through unmodified rather than appending
        // insertions to an incomplete document or erroring the response.
        const remaining = buffer + trailing;
        if (remaining) {
          controller.enqueue(encoder.encode(remaining));
        }
        return;
      }

      const remaining = trailing + getInsertedHTML();
      if (remaining) {
        controller.enqueue(encoder.encode(remaining));
      }
    },
  });
}
