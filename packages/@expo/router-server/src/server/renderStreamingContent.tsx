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
import { InnerRoot, registerStaticRootComponent } from 'expo-router/internal/static';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

import { getRootComponent } from '../static/getRootComponent';
import { createDebug } from '../utils/debug';
import {
  createInjectedCssAsString,
  createLoaderDataScriptAsString,
  getHydrationFlagScriptAsString,
  serializeHelmetToHtml,
} from '../utils/html';
import { createDocumentMetadataInjectionTransform } from '../utils/streams';

const debug = createDebug('expo:router:server:renderStreamingContent');

function resetReactNavigationContexts() {
  // https://github.com/expo/router/discussions/588
  // https://github.com/react-navigation/react-navigation/blob/9fe34b445fcb86e5666f61e144007d7540f014fa/packages/elements/src/getNamedContext.tsx#LL3C1-L4C1

  // React Navigation is storing providers in a global, this is fine for the first static render
  // but subsequent static renders of Stack or Tabs will cause React to throw a warning. To prevent this warning, we'll reset the globals before rendering.
  const contexts = '__react_navigation__elements_contexts';
  (globalThis as any)[contexts] = new Map<string, React.Context<any>>();
}

export type GetStreamingContentOptions = {
  loader?: {
    data?: any;
    /** Unique key for the route. Derived from the route's contextKey */
    key: string;
  };
  metadata?: {
    headTags: string;
  } | null;
  request?: Request;
  /** Asset manifest for hydration bundles (JS/CSS). Used in SSR. */
  assets?: {
    css: string[];
    js: string[];
  };
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

  // Clear any existing static resources from the global scope to attempt to prevent leaking between pages.
  // This could break if pages are rendered in parallel or if fonts are loaded outside of the React tree
  Font.resetServerContext();

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

/**
 * Streaming SSR renderer using `renderToReadableStream`. Returns a web `ReadableStream`
 * that emits the full HTML document with head injections applied.
 *
 * `<head>` tags are captured from shell-ready render state. Metadata produced only after suspended
 * or async work resolves is not guaranteed to appear in the initial HTML head and will reconcile on
 * the client after hydration instead.
 */
export async function getStreamingContent(
  location: URL,
  options?: GetStreamingContentOptions
): Promise<ReadableStream<Uint8Array>> {
  const { headContext, element, getStyleElement, loadedData } = prepareRenderContext(
    location,
    options
  );

  const stream = await ReactDOMServer.renderToReadableStream(
    <Head.Provider context={headContext}>
      <InnerRoot loadedData={loadedData}>{element}</InnerRoot>
    </Head.Provider>,
    {
      bootstrapScripts: options?.assets?.js,
      signal: options?.request?.signal,
    }
  );

  // Collect head injection content after the shell stream is ready.
  const css = ReactDOMServer.renderToStaticMarkup(getStyleElement());
  const { headTags, htmlAttributes, bodyAttributes } = serializeHelmetToHtml(headContext.helmet);
  const fonts = Font.getServerResources();
  debug(`Pushing static fonts: (count: ${fonts.length})`, fonts);

  const injectionParts: string[] = [];
  if (options?.metadata?.headTags) injectionParts.push(options.metadata.headTags);
  if (headTags) injectionParts.push(headTags);
  injectionParts.push(getHydrationFlagScriptAsString());
  if (css) injectionParts.push(css);
  if (fonts.length > 0) injectionParts.push(fonts.join(''));
  if (loadedData) injectionParts.push(createLoaderDataScriptAsString(loadedData));
  if (options?.assets?.css && options.assets.css.length > 0) {
    injectionParts.push(createInjectedCssAsString(options.assets.css));
  }

  return stream.pipeThrough(
    createDocumentMetadataInjectionTransform({
      injectionParts,
      htmlAttributes,
      bodyAttributes,
    })
  );
}

export { resolveMetadata } from './metadata';
