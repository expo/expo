/**
 * Copyright © 2026 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// NOTE(@hassankhan): disable when this file is its own entrypoint
// import '@expo/metro-runtime';

import Constants from 'expo-constants';
import * as Font from 'expo-font/build/server';
import { ExpoRoot } from 'expo-router';
import { ctx } from 'expo-router/_ctx';
import Head from 'expo-router/head';
import { ServerDocument } from 'expo-router/internal/server';
import {
  getRouteInfoForMatchedRoute,
  InnerRoot,
  registerStaticRootComponent,
} from 'expo-router/internal/static';
import { normalizeCssAssets, type AssetInfo, type MatchedRoute } from 'expo-server/private';
import React, { type ReactNode } from 'react';
import ReactDOMServer, { type ReactDOMServerReadableStream } from 'react-dom/server';

import { getRootComponent } from '../static/getRootComponent';
import { createDebug } from '../utils/debug';
import {
  createFaviconAsNode,
  createInjectedCssAsNodes,
  createInjectedFontsAsNodes,
  createInjectedScriptAsNodes,
  getBootstrapContents,
} from '../utils/react';

const debug = createDebug('expo:router:server:renderStreamingContent');

function resetReactNavigationContexts() {
  // https://github.com/expo/router/discussions/588
  // https://github.com/react-navigation/react-navigation/blob/9fe34b445fcb86e5666f61e144007d7540f014fa/packages/elements/src/getNamedContext.tsx#LL3C1-L4C1

  // React Navigation is storing providers in a global, this is fine for the first static render
  // but subsequent static renders of Stack or Tabs will cause React to throw a warning. To prevent this warning, we'll reset the globals before rendering.
  const contexts = '__react_navigation__elements_contexts';
  (globalThis as any)[contexts] = new Map<string, React.Context<any>>();
}

// NOTE(@hassankhan): Keep in sync with `expo-server/src/manifest.ts`
export type GetStreamingContentOptions = {
  loader?: {
    data?: any;
    /** Unique key for the route. Derived from the route's contextKey */
    key: string;
  };
  metadata?: {
    headNodes: ReactNode[];
  } | null;
  request?: Request;
  /** The route the server matched for `location`. */
  route: MatchedRoute;
  /** The params the server captured for `route`. */
  params?: Record<string, string | string[]>;
  /** Assets for hydration bundles and development-only inline CSS. */
  assets?: AssetInfo;
  /** Sets the output mode when exporting. */
  output?: 'static' | 'server';
  hydrate?: boolean;
};

function prepareRenderContext(location: URL, options: GetStreamingContentOptions) {
  const headContext: { helmet?: any } = {};
  const Root = getRootComponent();
  const { pathname, params } = getRouteInfoForMatchedRoute(
    options.route,
    options.params ?? {},
    location
  );

  const {
    // NOTE: The `element` that's returned adds two extra Views and
    // the seemingly unused `RootTagContext.Provider`.
    element,
    getStyleElement,
  } = registerStaticRootComponent(ExpoRoot, {
    location,
    context: ctx,
    wrapper: ({ children }: React.ComponentProps<any>) => (
      <Root pathname={pathname} params={params}>
        <div id="root">{children}</div>
      </Root>
    ),
  });

  resetReactNavigationContexts();

  const loaderKey = options.loader ? options.loader.key + location.search : null;

  const loadedData = loaderKey
    ? {
        [loaderKey]: options.loader?.data ?? null,
      }
    : null;

  return { headContext, element, getStyleElement, loadedData };
}

function FontResources() {
  // NOTE(@hassankhan): runs once during the shell pass; fonts loaded inside late-resolving
  // Suspense boundaries register after this and won't be emitted.
  const descriptors = Font.getServerResourceDescriptors();
  debug(`Pushing fonts: (count: ${descriptors.length})`, descriptors);
  return createInjectedFontsAsNodes(descriptors);
}

function isStreamingEnabled(): boolean {
  return Constants.expoConfig?.extra?.router?.streaming !== false;
}

/**
 * The longest time that server output waits for Suspense boundaries when streaming is disabled,
 * from when the shell is ready. The render is then aborted, and the browser renders the
 * boundaries that are still pending. The headers that they set with `setResponseHeaders()` are lost.
 * `FontResources` renders with the shell, so the fonts that late boundaries load are not in the page.
 */
const COMPLETE_RENDER_TIMEOUT_MS = 10_000;

/** Aborts with `signal`, or when `abort()` is called. */
function createLinkedAbortController(signal: AbortSignal | undefined): AbortController {
  const controller = new AbortController();
  if (signal?.aborted) {
    controller.abort(signal.reason);
  } else {
    signal?.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
  }
  return controller;
}

/** Waits for all Suspense boundaries, then aborts the boundaries still pending after the timeout. */
async function waitForAllReady(
  stream: ReactDOMServerReadableStream,
  controller: AbortController
): Promise<void> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const isReady = await Promise.race([
    stream.allReady.then(() => true),
    new Promise<false>((resolve) => {
      timeout = setTimeout(() => resolve(false), COMPLETE_RENDER_TIMEOUT_MS);
    }),
  ]).finally(() => clearTimeout(timeout));
  if (!isReady) {
    console.warn(
      `SSR render: Suspense boundaries did not resolve within ${COMPLETE_RENDER_TIMEOUT_MS} ms. The browser renders them.`
    );
    controller.abort(new Error(`Server render timed out after ${COMPLETE_RENDER_TIMEOUT_MS} ms`));
    await stream.allReady;
  }
}

/**
 * Renders the document using `renderToReadableStream`. Static output waits for Suspense
 * and returns HTML; server output returns a progressive stream, or a stream of the complete
 * document when the `streaming` option of the `expo-router` config plugin is `false`.
 */
export function getStreamingContent(
  location: URL,
  options: GetStreamingContentOptions & { output: 'static' }
): Promise<string>;
export function getStreamingContent(
  location: URL,
  options: GetStreamingContentOptions & { output?: 'server' }
): Promise<ReadableStream<Uint8Array>>;
export async function getStreamingContent(
  location: URL,
  options: GetStreamingContentOptions
): Promise<string | ReadableStream<Uint8Array>> {
  return Font.withServerContext(async () => {
    const { headContext, element, getStyleElement, loadedData } = prepareRenderContext(
      location,
      options
    );

    const { headNodes: cssNodes } = createInjectedCssAsNodes(normalizeCssAssets(options.assets));
    const faviconNode = options.assets?.favicon
      ? createFaviconAsNode(options.assets?.favicon)
      : undefined;

    const { headNodes: headJsNodes, bodyNodes: bodyJsNodes } = createInjectedScriptAsNodes(
      options.assets?.js ?? []
    );

    const serverDocumentData = {
      headNodes: [
        ...(options.metadata?.headNodes ?? []),
        faviconNode,
        getStyleElement({ key: 'rnw-style-element' }),
        ...(cssNodes ?? []),
        ...(headJsNodes ?? []),
      ].filter(Boolean),
      // NOTE(@hassankhan): React's bootstrapScripts emits async scripts, but Metro chunks must
      // execute in asset order so the runtime initializes before dependent chunks.
      bodyNodes: [<FontResources key="font-resources" />, ...(bodyJsNodes ?? [])],
    };

    const isStatic = options.output === 'static';
    const shouldWaitForAllReady = !isStatic && !isStreamingEnabled();
    // Lets the render be aborted after the timeout, as well as with the request.
    const abortController = shouldWaitForAllReady
      ? createLinkedAbortController(options.request?.signal)
      : null;
    const signal = abortController?.signal ?? options.request?.signal;
    const renderErrors: unknown[] = [];
    const stream = await ReactDOMServer.renderToReadableStream(
      <ServerDocument data={serverDocumentData}>
        <Head.Provider context={headContext}>
          <InnerRoot loadedData={loadedData}>{element}</InnerRoot>
        </Head.Provider>
      </ServerDocument>,
      {
        progressiveChunkSize: Number.MAX_SAFE_INTEGER,
        bootstrapScriptContent:
          getBootstrapContents({
            hydrate: options.hydrate ?? true,
            loadedData,
          }) || undefined,
        signal,
        onError(error) {
          if (signal?.aborted) {
            return;
          }

          if (isStatic) {
            renderErrors.push(error);
          } else {
            console.error('SSR streaming render error:', error);
          }
        },
      }
    );
    try {
      if (isStatic) {
        await stream.allReady;
        if (renderErrors.length > 0) {
          throw renderErrors[0];
        }
        return await new Response(stream).text();
      }
      if (abortController) {
        await waitForAllReady(stream, abortController);
      }
      return stream;
    } catch (error) {
      // Stops the render: nothing reads the stream after this.
      await stream.cancel(error).catch(() => {});
      throw error;
    }
  });
}

export { resolveMetadata } from './metadata';
