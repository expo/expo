import { ServerContainer, ServerContainerRef } from '@react-navigation/native';
import { App } from 'expo-router/entry';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { AppRegistry } from 'react-native-web';

AppRegistry.registerComponent('App', () => App);

export function serverRenderUrl(location: URL): string {
  const { element, getStyleElement } = AppRegistry.getApplication('App');

  const ref = React.createRef<ServerContainerRef>();

  const out = React.createElement(Root, {
    children: element,
    // scripts: (
    //   <>
    //     {scripts.map((script, index) => (
    //       <script key={String(index)} src={script} />
    //     ))}
    //   </>
    // ),
    scripts: <></>,
    styles: (
      <>
        <style id="react-native-reset-style" dangerouslySetInnerHTML={{ __html: style }} />
        {getStyleElement()}
      </>
    ),
  });

  let html = ReactDOMServer.renderToString(
    <ServerContainer ref={ref} location={location}>
      {out}
    </ServerContainer>
  );

  const options = ref.current?.getCurrentOptions();
  html = html.replace('<head>', `<head><title>${options?.title}</title>`);

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

export function Root({ children, scripts, styles }) {
  return (
    <html lang="en" style={{ height: '100%' }}>
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
