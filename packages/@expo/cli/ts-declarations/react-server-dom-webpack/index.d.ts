/** From Waku https://github.com/dai-shi/waku/blob/6cd492ce02a70371cb8b665eff4bcb22f483b12c/packages/waku/src/types.d.ts#L1 */
type ImportManifestEntry = {
  id: string;
  chunks: string[];
  name: string;
};

type ModuleLoading = null | {
  prefix: string;
  crossOrigin?: 'use-credentials' | '';
};

type SSRModuleMap = null | {
  [clientId: string]: {
    [clientExportName: string]: ImportManifestEntry;
  };
};

type SSRManifest = {
  moduleMap: SSRModuleMap;
  moduleLoading: ModuleLoading;
};

type ServerManifest = {
  [id: string]: ImportManifestEntry;
};

type ClientManifest = {
  [id: string]: ImportManifestEntry;
};

declare module 'react-server-dom-webpack/node-loader';

declare module 'react-server-dom-webpack/server.edge' {
  type Options = {
    environmentName?: string;
    identifierPrefix?: string;
    signal?: AbortSignal;
    temporaryReferences?: TemporaryReferenceSet;
    onError?: ((error: unknown) => void) | undefined;
    onPostpone?: ((reason: string) => void) | undefined;
  };

  export function renderToReadableStream(
    model: ReactClientValue,
    webpackMap: ClientManifest,
    options?: Options
  ): ReadableStream;

  export function decodeReply<T>(body: string | FormData, webpackMap?: ServerManifest): Promise<T>;

  export function registerServerReference(id: string, value: ReactServerValue): void;
}
declare module 'react-server-dom-webpack/server' {
  export * from 'react-server-dom-webpack/server.edge';
}

declare module 'react-server-dom-webpack/client' {
  export function createFromFetch<T>(
    promiseForResponse: Promise<Response>,
    options?: Options
  ): Promise<T>;
  export function encodeReply(
    value: ReactServerValue
  ): Promise<string | URLSearchParams | FormData>;
}

declare module 'react-server-dom-webpack/client.edge' {
  export type Options = {
    ssrManifest: SSRManifest;
    nonce?: string;
  };
  export function createFromReadableStream<T>(stream: ReadableStream, options: Options): Promise<T>;
}

declare module 'react-dom/server.edge' {
  export interface ReactDOMServerReadableStream extends ReadableStream {
    allReady: Promise<void>;
  }
  export function renderToReadableStream(
    children: ReactNode,
    options?: Options
  ): Promise<ReactDOMServerReadableStream>;
}
