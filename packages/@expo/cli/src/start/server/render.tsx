import { ServerContainer, ServerContainerRef } from '@react-navigation/native';
import { App } from 'expo-router/entry';
import Head from 'expo-router/head';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { AppRegistry } from 'react-native-web';

AppRegistry.registerComponent('App', () => App);

export function getManifest() {
  return require('expo-router/_getRoutesManifest').getManifest();
}

export function serverRenderUrl(location: URL): string {
  const headContext = {};

  const ref = React.createRef<ServerContainerRef>();

  const { element, getStyleElement } = AppRegistry.getApplication('App');

  const out = React.createElement(Root, {
    children: element,
    styles: <></>,
  });

  const html = ReactDOMServer.renderToString(
    <Head.Provider context={headContext}>
      <ServerContainer ref={ref} location={location}>
        {out}
      </ServerContainer>
    </Head.Provider>
  );

  // Eval the CSS after the HTML is rendered so that the CSS is in the same order
  const css = ReactDOMServer.renderToStaticMarkup(getStyleElement());

  let output = mixHeadComponentsWithStaticResults(headContext.helmet, html);

  output = output.replace('<head>', `<head>${css}`);

  return '<!DOCTYPE html>' + output;
}

function mixHeadComponentsWithStaticResults(helmet: any, html: string) {
  // Head components
  for (const key of ['title', 'priority', 'meta', 'link', 'script', 'style'].reverse()) {
    const result = helmet[key].toString();
    if (result) {
      html = html.replace('<head>', `<head>${result}`);
    }
  }

  // attributes
  html = html.replace('<html ', `<html ${helmet.htmlAttributes.toString()} `);
  html = html.replace('<body ', `<body ${helmet.bodyAttributes.toString()} `);

  return html;
}

// Default Root component:

// Follows the setup for react-native-web:
// https://necolas.github.io/react-native-web/docs/setup/#root-element
// Plus additional React Native scroll and text parity styles for various
// browsers.
// Force root DOM element to fill the parent's height
const style = `
html, body, #root {
  -webkit-overflow-scrolling: touch;
}
#root {
  display: flex;
  flex-direction: column;
  height: 100%;
}
html {
  scroll-behavior: smooth;
  -webkit-text-size-adjust: 100%;
}
body {
  /* Allows you to scroll below the viewport; default value is visible */
  overflow-y: auto;
  overscroll-behavior-y: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -ms-overflow-style: scrollbar;
}
`;

export function Root({ children, styles }) {
  return (
    <html lang="en" style={{ height: '100%' }}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1.00001,viewport-fit=cover"
        />
        <style id="expo-reset" dangerouslySetInnerHTML={{ __html: style }} />
        {styles}
      </head>
      <body style={{ height: '100%', overflow: 'hidden' }}>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
