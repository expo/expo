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
        throw new Error('Unexpected buffer type');
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
export async function renderJsxToFlightStringAsync(jsx, throwOnError = true) {
  return new Promise((res, rej) => {
    // Fail fast when an error occurs.
    // NOTE: This prevents E: objects from being added to the RSC.
    streamToString(
      renderJsxToReadableStream(jsx, { onError: throwOnError ? rej : undefined }).stream
    )
      .then(res)
      .catch(rej);
  });
}

export function renderJsxToReadableStream(jsx, { onError } = {}) {
  const clientBoundaries = [];
  const bundlerConfig = new Proxy(
    {},
    {
      get(_target, encodedId) {
        clientBoundaries.push(encodedId);
        const [file, name = ''] = encodedId.split('#');
        return {
          // HACK: To keep tests somewhat agnostic to the runtime environment, we'll make them relative to
          // the current working directory. It'd be better to have a stable value to test against though.
          id: path.relative(
            process.cwd(),
            file.startsWith('file://') ? decodeURI(file.slice(7)) : file
          ),
          chunks: [],
          name,
          async: true,
        };
      },
    }
  );

  return {
    stream: renderToReadableStream(jsx, bundlerConfig, {
      onError,
    }),
    clientBoundaries,
  };
}
