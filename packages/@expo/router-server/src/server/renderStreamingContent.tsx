/**
 * Copyright © 2026 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// NOTE(@hassankhan): disable when this file is its own entrypoint
// import '@expo/metro-runtime';

import * as Font from 'expo-font/build/server';
import { ExpoRoot } from 'expo-router';
import { ctx } from 'expo-router/_ctx';
import Head from 'expo-router/head';
import { ServerDocument } from 'expo-router/internal/server';
import { InnerRoot, registerStaticRootComponent } from 'expo-router/internal/static';
import { normalizeCssAssets, type AssetInfo } from 'expo-server/private';
import React, { type ReactNode } from 'react';
import ReactDOMServer from 'react-dom/server';

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
  /** Assets for hydration bundles and development-only inline CSS. */
  assets?: AssetInfo;
  /** Static output waits for Suspense and returns complete HTML. Defaults to live SSR. */
  output?: 'static' | 'server';
  hydrate?: boolean;
};

/**
 * Shared setup for both `getStaticContent()` and `getStreamingContent()`. Creates the React element
 * tree, resets server contexts, and computes loader data.
 */
function prepareRenderContext(location: URL, options?: GetStreamingContentOptions) {
  const headContext: { helmet?: any } = {};
  const Root = getRootComponent();

  const {
    // NOTE: The `element` that's returned adds two extra Views and
    // the seemingly unused `RootTagContext.Provider`.
    element,
    getStyleElement,
  } = registerStaticRootComponent(ExpoRoot, {
    location,
    context: ctx,
    wrapper: ({ children }: React.ComponentProps<any>) => (
      <Root>
        <div id="root">{children}</div>
      </Root>
    ),
  });

  // This MUST be run before `ReactDOMServer.renderToString` to prevent
  // "Warning: Detected multiple renderers concurrently rendering the same context provider. This is currently unsupported."
  resetReactNavigationContexts();

  const loaderKey = options?.loader ? options.loader.key + location.search : null;

  const loadedData = loaderKey
    ? {
        [loaderKey]: options?.loader?.data ?? null,
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

/**
 * Renders the document using `renderToReadableStream`. Static output waits for Suspense
 * and returns HTML; server output returns a progressive stream.
 */
export function getStreamingContent(
  location: URL,
  options: GetStreamingContentOptions & { output: 'static' }
): Promise<string>;
export function getStreamingContent(
  location: URL,
  options?: GetStreamingContentOptions & { output?: 'server' }
): Promise<ReadableStream<Uint8Array>>;
export async function getStreamingContent(
  location: URL,
  options?: GetStreamingContentOptions
): Promise<string | ReadableStream<Uint8Array>> {
  return Font.withServerContext(async () => {
    const { headContext, element, getStyleElement, loadedData } = prepareRenderContext(
      location,
      options
    );

    const { headNodes: cssNodes } = createInjectedCssAsNodes(normalizeCssAssets(options?.assets));
    const faviconNode = options?.assets?.favicon
      ? createFaviconAsNode(options?.assets?.favicon)
      : undefined;

    const { headNodes: headJsNodes, bodyNodes: bodyJsNodes } = createInjectedScriptAsNodes(
      options?.assets?.js ?? []
    );

    const serverDocumentData = {
      headNodes: [
        ...(options?.metadata?.headNodes ?? []),
        faviconNode,
        getStyleElement({ key: 'rnw-style-element' }),
        ...(cssNodes ?? []),
        ...(headJsNodes ?? []),
      ].filter(Boolean),
      // NOTE(@hassankhan): React's bootstrapScripts emits async scripts, but Metro chunks must
      // execute in asset order so the runtime initializes before dependent chunks.
      bodyNodes: [<FontResources key="font-resources" />, ...(bodyJsNodes ?? [])],
    };

    const isStatic = options?.output === 'static';
    const renderErrors: unknown[] = [];
    const stream = await ReactDOMServer.renderToReadableStream(
      <ServerDocument data={serverDocumentData}>
        {/* Retain the provider so existing <Head> components can render. */}
        <Head.Provider context={headContext}>
          <InnerRoot loadedData={loadedData}>{element}</InnerRoot>
        </Head.Provider>
      </ServerDocument>,
      {
        // Static output must keep large resolved Suspense content visible without JavaScript.
        progressiveChunkSize: isStatic ? Number.POSITIVE_INFINITY : 12800 * 2,
        bootstrapScriptContent:
          getBootstrapContents({
            hydrate: options?.hydrate ?? true,
            loadedData,
          }) || undefined,
        signal: options?.request?.signal,
        onError(error) {
          if (options?.request?.signal.aborted) {
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
    if (isStatic) {
      await stream.allReady;
      if (renderErrors.length > 0) {
        throw renderErrors[0];
      }
      return new Response(stream).text();
    }
    return stream;
  });
}

export { resolveMetadata } from './metadata';
