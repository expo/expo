import * as React from 'react';
import ReactDOM from 'react-dom';
import withExpoRoot from './withExpoRoot';

export default function registerRootComponent(component) {
  const App = withExpoRoot(component);
  ReactDOM.render(<App exp={{}} />, global.document.getElementById('main'));
}
