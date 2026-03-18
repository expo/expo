/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import '@expo/metro-runtime';

import * as Font from 'expo-font/build/server';
import { ExpoRoot } from 'expo-router';
import { ctx } from 'expo-router/_ctx';
import Head from 'expo-router/head';
import { InnerRoot, registerStaticRootComponent } from 'expo-router/internal/static';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

import { getRootComponent } from './getRootComponent';
import { createDebug } from '../utils/debug';
import {
  createInjectedCssElements,
  createLoaderDataScript,
  getHydrationFlagScript,
  serializeHelmetToHtml,
} from '../utils/html';
import { createDocumentMetadataInjectionTransform } from '../utils/streams';

const debug = createDebug('expo:router:server:renderStaticContent');

function resetReactNavigationContexts() {
  // https://github.com/expo/router/discussions/588
  // https://github.com/react-navigation/react-navigation/blob/9fe34b445fcb86e5666f61e144007d7540f014fa/packages/elements/src/getNamedContext.tsx#LL3C1-L4C1

  // React Navigation is storing providers in a global, this is fine for the first static render
  // but subsequent static renders of Stack or Tabs will cause React to throw a warning. To prevent this warning, we'll reset the globals before rendering.
  const contexts = '__react_navigation__elements_contexts';
  (globalThis as any)[contexts] = new Map<string, React.Context<any>>();
}

export type GetStaticContentOptions = {
  loader?: {
    data?: any;
    /** Unique key for the route. Derived from the route's contextKey */
    key: string;
  };
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
function prepareRenderContext(location: URL, options?: GetStaticContentOptions) {
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

export async function getStaticContent(
  location: URL,
  options?: GetStaticContentOptions
): Promise<string> {
  const { headContext, element, getStyleElement, loadedData } = prepareRenderContext(
    location,
    options
  );

  const html = ReactDOMServer.renderToString(
    <Head.Provider context={headContext}>
      <InnerRoot loadedData={loadedData}>{element}</InnerRoot>
    </Head.Provider>
  );

  // Eval the CSS after the HTML is rendered so that the CSS is in the same order
  const css = ReactDOMServer.renderToStaticMarkup(getStyleElement());

  let output = mixHeadComponentsWithStaticResults(headContext.helmet, html);

  output = output.replace('</head>', `${css}</head>`);

  const fonts = Font.getServerResources();
  debug(`Pushing static fonts: (count: ${fonts.length})`, fonts);
  // Inject static fonts loaded with expo-font
  output = output.replace('</head>', `${fonts.join('')}</head>`);
  if (loadedData) {
    output = output.replace('</head>', `${createLoaderDataScript(loadedData)}</head>`);
  }

  // Inject hydration assets (JS/CSS bundles). Used in SSR mode
  if (options?.assets) {
    if (options.assets.css.length > 0) {
      const injectedCSS = createInjectedCssElements(options.assets.css);
      output = output.replace('</head>', `${injectedCSS}\n</head>`);
    }

    if (options.assets.js.length > 0) {
      // In non-streaming mode, use deferred scripts in the body
      output = output.replace(
        '</body>',
        `${options.assets.js.map((src) => `<script src="${src}" defer></script>`).join('\n')}\n</body>`
      );
    }
  }

  return '<!DOCTYPE html>' + output;
}

function mixHeadComponentsWithStaticResults(helmet: any, html: string) {
  const { headTags, htmlAttributes, bodyAttributes } = serializeHelmetToHtml(helmet);

  if (headTags) {
    html = html.replace('<head>', `<head>${headTags}`);
  }

  // attributes
  html = html.replace('<html ', `<html ${htmlAttributes} `);
  html = html.replace('<body ', `<body ${bodyAttributes} `);

  return html;
}

/**
 * Streaming SSR renderer using `renderToReadableStream`. Returns a web `ReadableStream`
 * that emits the full HTML document with head injections applied.
 *
 * `<head>` tags are captured from shell-ready render state. Metadata produced only after suspended
 * or async work resolves is not guaranteed to appear in the initial HTML head and will reconcile on
 * the client after hydration instead.
 *
 * @privateRemarks This function should be moved to a separate file
 * (i.e. `renderStreamingContent.tsx`) as it doesn't belong with static rendering logic.
 */
export async function getStreamingContent(
  location: URL,
  options?: GetStaticContentOptions
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
  if (headTags) injectionParts.push(headTags);
  injectionParts.push(getHydrationFlagScript());
  if (css) injectionParts.push(css);
  if (fonts.length > 0) injectionParts.push(fonts.join(''));
  if (loadedData) injectionParts.push(createLoaderDataScript(loadedData));
  if (options?.assets?.css && options.assets.css.length > 0) {
    injectionParts.push(createInjectedCssElements(options.assets.css));
  }

  return stream.pipeThrough(
    createDocumentMetadataInjectionTransform({
      injectionParts,
      htmlAttributes,
      bodyAttributes,
    })
  );
}

// Re-export for use in server
export { getBuildTimeServerManifestAsync, getManifest } from './getServerManifest';
