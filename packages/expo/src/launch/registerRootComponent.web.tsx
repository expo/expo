import { createElement } from 'react';
import ReactDOM from 'react-dom';
import wrapWithExpoRoot from './wrapWithExpoRoot';

export default function registerRootComponent(component) {
  const App = wrapWithExpoRoot(component);
  // TODO: Bacon: Add this to AppRegistry?
  ReactDOM.render(createElement(App), global.document.getElementById('main'));
  //   AppRegistry.registerComponent('main', () => wrapWithExpoRoot(component));
}
