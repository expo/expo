/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import '@expo/metro-runtime';
import { ServerContainer } from '@react-navigation/native';
import * as Font from 'expo-font/build/server';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { AppRegistry } from 'react-native-web';
import { getRootComponent } from './getRootComponent';
import { ctx } from '../../_ctx';
import { ExpoRoot } from '../ExpoRoot';
import { getNavigationConfig } from '../getLinkingConfig';
import { getRoutes } from '../getRoutes';
import { Head } from '../head';
import { loadStaticParamsAsync } from '../loadStaticParamsAsync';
AppRegistry.registerComponent('App', () => ExpoRoot);
/** Get the linking manifest from a Node.js process. */
async function getManifest(options) {
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
    global[contexts] = new Map();
}
export function getStaticContent(location) {
    const headContext = {};
    const ref = React.createRef();
    const { 
    // NOTE: The `element` that's returned adds two extra Views and
    // the seemingly unused `RootTagContext.Provider`.
    element, getStyleElement, } = AppRegistry.getApplication('App', {
        initialProps: {
            location,
            context: ctx,
            wrapper: ({ children }) => (React.createElement(Root, null,
                React.createElement("div", { id: "root" }, children))),
        },
    });
    const Root = getRootComponent();
    // Clear any existing static resources from the global scope to attempt to prevent leaking between pages.
    // This could break if pages are rendered in parallel or if fonts are loaded outside of the React tree
    Font.resetServerContext();
    // This MUST be run before `ReactDOMServer.renderToString` to prevent
    // "Warning: Detected multiple renderers concurrently rendering the same context provider. This is currently unsupported."
    resetReactNavigationContexts();
    const html = ReactDOMServer.renderToString(React.createElement(Head.Provider, { context: headContext },
        React.createElement(ServerContainer, { ref: ref }, element)));
    // Eval the CSS after the HTML is rendered so that the CSS is in the same order
    const css = ReactDOMServer.renderToStaticMarkup(getStyleElement());
    let output = mixHeadComponentsWithStaticResults(headContext.helmet, html);
    output = output.replace('</head>', `${css}</head>`);
    // Inject static fonts loaded with expo-font
    output = output.replace('</head>', `${Font.getServerResources().join('')}</head>`);
    return '<!DOCTYPE html>' + output;
}
function mixHeadComponentsWithStaticResults(helmet, html) {
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
//# sourceMappingURL=renderStaticContent.js.map