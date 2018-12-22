import * as React from 'react';
import ReactDOM from 'react-dom';
import withExpoRoot, { InitialProps } from './withExpoRoot';

export default function registerRootComponent<P extends InitialProps>(
  component: React.ComponentClass<P>
): void {
  // @ts-ignore: TypeScript says ComponentClass<P> does not satisfy ComponentClass<any>
  const App = withExpoRoot(component);
  // @ts-ignore: TypeScript says ComponentClass<P> does not satisfy ComponentClass<any>
  ReactDOM.render(<App exp={{}} />, global.document.getElementById('main'));
}
