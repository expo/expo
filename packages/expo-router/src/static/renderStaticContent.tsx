/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import '@expo/metro-runtime';

import { ServerContainer, ServerContainerRef } from '@react-navigation/native';
import { ctx } from 'expo-router/_ctx';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { AppRegistry } from 'react-native-web';

import { ExpoRoot, ExpoRootProps } from '../ExpoRoot';
import { getNavigationConfig } from '../getLinkingConfig';
import { getRoutes } from '../getRoutes';
import { Head } from '../head';
import { loadStaticParamsAsync } from '../loadStaticParamsAsync';
import { getRootComponent } from './getRootComponent';

/// <reference types="expo-router/index" />

AppRegistry.registerComponent('App', () => App);

// Must be exported or Fast Refresh won't update the context >:[
function App(props: Omit<ExpoRootProps, 'context'>) {
  return <ExpoRoot context={ctx} {...props} />;
}

/** Get the linking manifest from a Node.js process. */
async function getManifest(options: any) {
  const routeTree = getRoutes(ctx, options);

  if (!routeTree) {
    throw new Error('No routes found');
  }

  // Evaluate all static params
  await loadStaticParamsAsync(routeTree);

  return getNavigationConfig(routeTree);
}

function resetReactNavigationContexts() {
  // https://github.com/expo/router/discussions/588
  // https://github.com/react-navigation/react-navigation/blob/9fe34b445fcb86e5666f61e144007d7540f014fa/packages/elements/src/getNamedContext.tsx#LL3C1-L4C1

  // React Navigation is storing providers in a global, this is fine for the first static render
  // but subsequent static renders of Stack or Tabs will cause React to throw a warning. To prevent this warning, we'll reset the globals before rendering.
  const contexts = '__react_navigation__elements_contexts';
  global[contexts] = new Map<string, React.Context<any>>();
}

export function getStaticContent(location: URL): string {
  const headContext: { helmet?: any } = {};

  const ref = React.createRef<ServerContainerRef>();

  const {
    // Skipping the `element` that's returned to ensure the HTML
    // matches what's used in the client -- this results in two extra Views and
    // the seemingly unused `RootTagContext.Provider` from being added.
    getStyleElement,
  } = AppRegistry.getApplication('App');

  const Root = getRootComponent();

  // This MUST be run before `ReactDOMServer.renderToString` to prevent
  // "Warning: Detected multiple renderers concurrently rendering the same context provider. This is currently unsupported."
  resetReactNavigationContexts();

  const html = ReactDOMServer.renderToString(
    <Head.Provider context={headContext}>
      <ServerContainer ref={ref}>
        <App
          location={location}
          wrapper={({ children }) => {
            return React.createElement(Root, {
              children: React.createElement(
                'div',
                {
                  id: 'root',
                },
                children
              ),
            });
          }}
        />
      </ServerContainer>
    </Head.Provider>
  );

  // Eval the CSS after the HTML is rendered so that the CSS is in the same order
  const css = ReactDOMServer.renderToStaticMarkup(getStyleElement());

  let output = mixHeadComponentsWithStaticResults(headContext.helmet, html);

  output = output.replace('</head>', `${css}</head>`);

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
export { getManifest };
