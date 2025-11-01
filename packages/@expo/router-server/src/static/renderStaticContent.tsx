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
import ReactDOMServer from 'react-dom/server.node';

import { getRootComponent } from './getRootComponent';
import { PreloadedDataScript } from './html';

const debug = require('debug')('expo:router:server:renderStaticContent');

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
  };
};

export async function getStaticContent(
  location: URL,
  options?: GetStaticContentOptions
): Promise<string> {
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

  const loadedData = options?.loader?.data ? { [location.pathname]: options.loader.data } : null;

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
  // debug('Push static fonts:', fonts)
  // Inject static fonts loaded with expo-font
  output = output.replace('</head>', `${fonts.join('')}</head>`);

  if (loadedData) {
    const loaderDataScript = ReactDOMServer.renderToStaticMarkup(
      <PreloadedDataScript data={loadedData} />
    );
    output = output.replace('</head>', `${loaderDataScript}</head>`);
  }

  return '<!DOCTYPE html>' + output;
}

function mixHeadComponentsWithStaticResults(helmet: any, html: string) {
  // Head components
  for (const key of ['title', 'priority', 'meta', 'link', 'script', 'style'].reverse()) {
    const result = helmet?.[key]?.toString();
    if (result) {
      html = html.replace('<head>', `<head>${result}`);
    }
  }

  // attributes
  html = html.replace('<html ', `<html ${helmet?.htmlAttributes.toString()} `);
  html = html.replace('<body ', `<body ${helmet?.bodyAttributes.toString()} `);

  return html;
}

// Re-export for use in server
export { getBuildTimeServerManifestAsync, getManifest } from './getServerManifest';
