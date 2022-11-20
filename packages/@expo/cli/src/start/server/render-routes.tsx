import React, { createElement } from 'react';
import ReactDOMServer from 'react-dom/server';
import { AppRegistry, ComponentProvider } from 'react-native';

function renderReactNative(
  name: string,
  Root: any,
  Component: ComponentProvider,
  scripts: string[]
) {
  // register the app
  AppRegistry.registerComponent(name, Component);

  // prerender the app
  const { element, getStyleElement } = AppRegistry.getApplication(name);

  const out = createElement(Root, {
    children: element,
    scripts: (
      <>
        {scripts.map((script, index) => (
          <script key={String(index)} src={script} />
        ))}
      </>
    ),
    styles: (
      <>
        <style id="react-native-reset-style" dangerouslySetInnerHTML={{ __html: style }} />
        {getStyleElement()}
      </>
    ),
  });
  // first the element
  const markup = ReactDOMServer.renderToString(out);

  return '<!DOCTYPE html>' + markup;
}

export function renderRoutes({ scripts }: { scripts: string[] }) {
  const registry = require.context(
    // This assumes the file is copied to `/.expo/web/xxx.js`
    '../../app'
  );

  // Allow overwriting the root component with `app/_root.js` -- should probably be `app/_layout.js`
  const rootKey = registry
    .keys()
    .find((key) => key.replace('./', '').replace(/\.[jt]sx?$/, '') === '_root');
  const _Root = (rootKey && registry(rootKey)?.default) ?? Root;
  return registry.keys().reduce((acc, key) => {
    const mod = registry(key);
    if (mod?.default) {
      const name = key.replace('./', '').replace(/\.[jt]sx?$/, '');

      if (name !== '_root') {
        acc[name] = renderReactNative(name, _Root, () => mod.default, scripts);
      }
    }
    return acc;
  }, {});
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

export function Root({ children, scripts, styles }) {
  return (
    <html style={{ height: '100%' }}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1.00001,viewport-fit=cover"
        />
        {styles}
      </head>
      <body style={{ height: '100%', overflow: 'hidden' }}>
        <div id="root">{children}</div>
        {scripts}
      </body>
    </html>
  );
}
