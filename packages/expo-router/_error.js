import LogBoxInspectorContainer from '@expo/log-box/src/logbox-web-polyfill';
import { AppRegistry } from 'react-native';

registerRootComponentInShadowDOM(LogBoxInspectorContainer);

function registerRootComponentInShadowDOM(component) {
  AppRegistry.registerComponent('main', () => component);

  if (process.env.EXPO_OS !== 'web' || !window) {
    console.error('expo-router/_error can be rendered only on Web.');
    return;
  }

  const host = window.document.getElementById('root');
  if (!host) {
    throw new Error('Required HTML element with id "root" was not found in the document HTML.');
  }

  const shadow = host.attachShadow({ mode: 'open' });
  const rootTag = window.document.createElement('div');
  rootTag.id = 'shadow-root';
  shadow.appendChild(rootTag);

  AppRegistry.runApplication('main', {
    rootTag,
  });

  // NOTE(@krystofwoldrich): Same as `react-native-stylesheet`
  // I would expect the loaded css to be attached to the shadow host (not document head)
  // For now we need to copy the styles manually
  window.document.querySelectorAll('style').forEach((styleEl) => {
    const isHmrLoadedCss = !!styleEl.getAttribute('data-expo-css-hmr');
    if (isHmrLoadedCss) {
      shadow.appendChild(styleEl.cloneNode(true));
    }
  });
}
