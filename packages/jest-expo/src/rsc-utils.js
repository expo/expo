import path from 'path';
import { renderToReadableStream } from 'react-server-dom-webpack/server';

export const streamToString = async (stream) => {
  const decoder = new TextDecoder();
  const reader = stream.getReader();
  const outs = [];
  let result;
  do {
    result = await reader.read();
    if (result.value) {
      if (!(result.value instanceof Uint8Array) && !('value' in result)) {
        throw new Error('Unexepected buffer type');
      }
      outs.push(decoder.decode(result.value, { stream: true }));
    }
  } while (!result.done);
  outs.push(decoder.decode());
  return outs.join('');
};

/**
 * Helper function to render JSX to an RSC Payload (flight) string in a way that is similar to Expo Router.
 *
 * @param {*} jsx
 * @returns
 */
export async function renderJsxToFlightStringAsync(jsx) {
  return streamToString(renderJsxToReadableStream(jsx).stream);
}

export function renderJsxToReadableStream(jsx) {
  const clientBoundaries = [];
  const bundlerConfig = new Proxy(
    {},
    {
      get(_target, encodedId) {
        clientBoundaries.push(encodedId);
        const [file, name = ''] = encodedId.split('#');

        const filePath = file.startsWith('file://')
          ? decodeURI(file.slice('file://'.length))
          : file;

        // HACK: To keep tests somewhat agnostic to the runtime environment, we'll make them relative to
        // the current working directory. It'd be better to have a stable value to test against though.
        const metroOpaqueId = path.relative(process.cwd(), filePath);

        return {
          id: metroOpaqueId,
          chunks: [],
          name,
          async: true,
        };
      },
    }
  );

  return {
    stream: renderToReadableStream(jsx, bundlerConfig),
    clientBoundaries,
  };
}
