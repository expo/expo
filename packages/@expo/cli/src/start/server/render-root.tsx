import { ServerContainer, ServerContainerRef } from '@react-navigation/native';
import { App } from 'expo-router/entry';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { AppRegistry } from 'react-native-web';

AppRegistry.registerComponent('App', () => App);

export function serverRenderUrl(location: URL): string {
  const { element, getStyleElement } = AppRegistry.getApplication('App');

  const ref = React.createRef<ServerContainerRef>();

  const html = ReactDOMServer.renderToString(
    <ServerContainer ref={ref} location={location}>
      {element}
    </ServerContainer>
  );

  const css = ReactDOMServer.renderToStaticMarkup(getStyleElement());

  const options = ref.current?.getCurrentOptions();

  const document = `
        <!DOCTYPE html>
        <html style="height: 100%">
        <meta charset="utf-8">
        <meta httpEquiv="X-UA-Compatible" content="IE=edge">
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1.00001, viewport-fit=cover"
        >
        ${css}
        <title>${options?.title}</title>
        <body style="min-height: 100%">
        <div id="root" style="display: flex; min-height: 100vh">
        ${html}
        </div>
    `;

  return document;
}
