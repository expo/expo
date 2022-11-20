import ReactDOMServer from 'react-dom/server';
import { AppRegistry } from 'react-native';

function renderReactNative(name: string, Component: Function) {
  // const ReactDOMServer = importReactDomServerFromProject(projectRoot);
  // const AppRegistry = importReactNativeWebAppRegistryFromProject(projectRoot);

  // // register the app
  AppRegistry.registerComponent(name, () => Component);

  // prerender the app
  const { element, getStyleElement } = AppRegistry.getApplication(name, {});
  // first the element
  const markup = ReactDOMServer.renderToString(element);
  // then the styles
  const css = ReactDOMServer.renderToStaticMarkup(getStyleElement());

  // console.log('markup', markup);
  // console.log('css', css);

  return { css, markup };
}

export function renderRoutes() {
  const registry = require.context('[PATH_TO_COMPONENTS]');

  return registry.keys().reduce((acc, key) => {
    const mod = registry(key);
    if (mod?.default) {
      const name = key.replace('./', '').replace(/\.[jt]sx?$/, '');

      acc[name] = renderReactNative(name, mod?.default);
    }
    return acc;
  }, {});
}
