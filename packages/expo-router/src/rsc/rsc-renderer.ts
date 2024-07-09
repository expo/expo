/**
 * Copyright © 2024 650 Industries.
 * Copyright © 2024 dai-shi.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * From waku https://github.com/dai-shi/waku/blob/32d52242c1450b5f5965860e671ff73c42da8bd0/packages/waku/src/lib/renderers/rsc-renderer.ts
 */

import { registerServerReference } from 'react-server-dom-webpack/server';

type EntriesDev = any;
type EntriesPrd = any;

// Make global so we only pull in one instance for state saved in the react-server-dom-webpack package.
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
  searchParams: URLSearchParams;
  method: 'GET' | 'POST';
  context: Record<string, unknown> | undefined;
  body?: ReadableStream | undefined;
  contentType?: string | undefined;
  moduleIdCallback?: (module: {
    id: string;
    chunks: string[];
    name: string;
    async: boolean;
  }) => void;
};

type ResolveClientEntry = (id: string) => { id: string; chunks: string[] };

type RenderRscOpts =
  | {
      isExporting: true;
      entries: EntriesPrd;
      resolveClientEntry?: ResolveClientEntry;
    }
  | {
      isExporting: false;
      entries: EntriesDev;
      resolveClientEntry: ResolveClientEntry;
    };

export async function renderRsc(args: RenderRscArgs, opts: RenderRscOpts): Promise<ReadableStream> {
  throw new Error('Not implemented');
}
