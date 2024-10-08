/**
 * Copyright © 2024 650 Industries.
 * Copyright © 2024 dai-shi.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * From waku https://github.com/dai-shi/waku/blob/32d52242c1450b5f5965860e671ff73c42da8bd0/packages/waku/src/lib/renderers/rsc-renderer.ts
 */

// This file must remain platform agnostic for production exports.

import type { ReactNode } from 'react';
import {
  renderToReadableStream,
  decodeReply,
  registerServerReference,
} from 'react-server-dom-webpack/server';

import { fileURLToFilePath } from './path';
import { filePathToFileURL, decodeActionId } from './router/utils';
import { runWithRenderStore, type EntriesDev, type EntriesPrd } from './server';

// Make global so we only pull in one instance for state saved in the react-server-dom-webpack package.
// @ts-ignore: HACK type for server actions
globalThis._REACT_registerServerReference = registerServerReference;

export interface RenderContext<T = unknown> {
  rerender: (input: string, searchParams?: URLSearchParams) => void;
  context: T;
}

type ResolvedConfig = any;

export type RenderRscArgs = {
  // TODO:
  config: ResolvedConfig;

  // Done
  input: string;
  context: Record<string, unknown> | undefined;
  body?: ReadableStream | undefined;
  contentType?: string | undefined;
  decodedBody?: unknown;
  moduleIdCallback?: (module: {
    id: string;
    chunks: string[];
    name: string;
    async: boolean;
  }) => void;
  onError?: (err: unknown) => void;
};

type ResolveClientEntry = (id: string) => { id: string; chunks: string[] };

type RenderRscOpts = {
  isExporting: boolean;
  entries: EntriesDev;
  resolveClientEntry: ResolveClientEntry;
  loadServerModuleRsc: (url: string) => Promise<any>;
};

export async function renderRsc(args: RenderRscArgs, opts: RenderRscOpts): Promise<ReadableStream> {
  const { input, body, contentType, context, onError } = args;
  const { resolveClientEntry, entries } = opts;

  const {
    default: { renderEntries },
    // @ts-expect-error
    buildConfig,
  } = entries as (EntriesDev & { loadModule: never; buildConfig: never }) | EntriesPrd;

  const bundlerConfig = new Proxy(
    {},
    {
      get(_target, encodedId: string) {
        const [
          // File is the on-disk location of the module, this is injected during the "use client" transformation (babel).
          file,
          // The name of the import (e.g. "default" or "")
          // This will be empty when using `module.exports = ` and `require('...')`.
          name = '',
        ] = encodedId.split('#') as [string, string];

        // HACK: Special handling for server actions being recursively resolved, e.g. ai demo.
        if (encodedId.match(/[0-9a-z]{40}#/i)) {
          // TODO: Rework server actions to use some ES Modules like system instead of the globals.
          return { id: encodedId, chunks: [encodedId], name: '*', async: true };
        }

        const filePath = file.startsWith('file://') ? fileURLToFilePath(file) : file;

        args.moduleIdCallback?.({
          id: filePath,
          chunks: [
            // TODO: Add a lookup later which reads from the SSR manifest to get the correct chunk.
            // NOTE(EvanBacon): This is a placeholder since we need to render RSC to get the client boundaries, which we then inject later.
            'chunk:' + filePath,
          ],
          name,
          async: true,
        });
        // We'll augment the file path with the incoming RSC request which will forward the metro props required to make a cache hit, e.g. platform=web&...
        // This is similar to how we handle lazy bundling.
        const resolved = resolveClientEntry(filePath);
        return { id: resolved.id, chunks: resolved.chunks, name, async: true };
      },
    }
  );

  const renderWithContext = async (
    context: Record<string, unknown> | undefined,
    input: string,
    params: unknown
  ) => {
    const renderStore = {
      context: context || {},
      rerender: () => {
        throw new Error('Cannot rerender');
      },
    };
    return runWithRenderStore(renderStore, async () => {
      const elements = await renderEntries(input, {
        params,
        buildConfig,
      });
      if (elements === null) {
        const err = new Error('No function component found at: ' + input);
        (err as any).statusCode = 404;
        throw err;
      }
      if (Object.keys(elements).some((key) => key.startsWith('_'))) {
        throw new Error('"_" prefix is reserved');
      }
      return renderToReadableStream(elements, bundlerConfig, {
        onError,
      });
    });
  };

  const renderWithContextWithAction = async (
    context: Record<string, unknown> | undefined,
    actionFn: (...args: unknown[]) => unknown,
    actionArgs: unknown[]
  ) => {
    let elementsPromise: Promise<Record<string, ReactNode>> = Promise.resolve({});
    let rendered = false;
    const renderStore = {
      context: context || {},
      rerender: async (input: string, params?: unknown) => {
        if (rendered) {
          throw new Error('already rendered');
        }
        elementsPromise = Promise.all([
          elementsPromise,
          renderEntries(input, { params, buildConfig }),
        ]).then(([oldElements, newElements]) => ({
          ...oldElements,
          // FIXME we should actually check if newElements is null and send an error
          ...newElements,
        }));
      },
    };
    return runWithRenderStore(renderStore, async () => {
      const actionValue = await actionFn(...actionArgs);
      const elements = await elementsPromise;
      rendered = true;
      if (Object.keys(elements).some((key) => key.startsWith('_'))) {
        throw new Error('"_" prefix is reserved');
      }
      return renderToReadableStream({ ...elements, _value: actionValue }, bundlerConfig, {
        onError,
      });
    });
  };

  let decodedBody: unknown | undefined = args.decodedBody;
  if (body) {
    const bodyStr = await streamToString(body);
    if (typeof contentType === 'string' && contentType.startsWith('multipart/form-data')) {
      // XXX This doesn't support streaming unlike busboy
      const formData = parseFormData(bodyStr, contentType);
      decodedBody = await decodeReply(
        formData,
        // TODO: add server action config
        bundlerConfig
      );
    } else if (bodyStr) {
      decodedBody = await decodeReply(
        bodyStr,
        // TODO: add server action config
        bundlerConfig
      );
    }
  }

  const actionId = decodeActionId(input);
  if (actionId) {
    const args = Array.isArray(decodedBody) ? decodedBody : [];
    const [fileId, name] = actionId.split('#') as [string, string];
    const mod = await opts.loadServerModuleRsc(filePathToFileURL(fileId));
    const fn = name === '*' ? name : mod[name] || mod;
    return renderWithContextWithAction(context, fn, args);
  }

  // method === 'GET'
  return renderWithContext(context, input, decodedBody);
}

// TODO is this correct? better to use a library?
const parseFormData = (body: string, contentType: string) => {
  const boundary = contentType.split('boundary=')[1];
  const parts = body.split(`--${boundary}`);
  const formData = new FormData();
  for (const part of parts) {
    if (part.trim() === '' || part === '--') continue;
    const [rawHeaders, content] = part.split('\r\n\r\n', 2);
    const headers = rawHeaders!.split('\r\n').reduce(
      (acc, currentHeader) => {
        const [key, value] = currentHeader.split(': ');
        acc[key!.toLowerCase()] = value!;
        return acc;
      },
      {} as Record<string, string>
    );
    const contentDisposition = headers['content-disposition'];
    const nameMatch = /name="([^"]+)"/.exec(contentDisposition!);
    const filenameMatch = /filename="([^"]+)"/.exec(contentDisposition!);
    if (nameMatch) {
      const name = nameMatch[1];
      if (filenameMatch) {
        const filename = filenameMatch[1];
        const type = headers['content-type'] || 'application/octet-stream';
        const blob = new Blob([content!], { type });
        formData.append(name!, blob, filename);
      } else {
        formData.append(name!, content!.trim());
      }
    }
  }
  return formData;
};

const streamToString = async (stream: ReadableStream): Promise<string> => {
  const decoder = new TextDecoder();
  const reader = stream.getReader();
  const outs: string[] = [];
  let result: ReadableStreamReadResult<unknown>;
  do {
    result = await reader.read();
    if (result.value) {
      if (!(result.value instanceof Uint8Array)) {
        throw new Error('Unexepected buffer type');
      }
      outs.push(decoder.decode(result.value, { stream: true }));
    }
  } while (!result.done);
  outs.push(decoder.decode());
  return outs.join('');
};
