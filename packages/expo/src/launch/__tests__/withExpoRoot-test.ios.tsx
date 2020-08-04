import * as React from 'react';
import renderer, { ReactTestInstance } from 'react-test-renderer';

import AppLoading from '../AppLoading';
import RootErrorBoundary from '../RootErrorBoundary';
import withExpoRoot from '../withExpoRoot';
import { withDEV } from './utils';

it('does not render RootErrorBoundary in DEV=true or DEV=false', () => {
  withDEV(true, () => {
    const testInstance = renderer.create(<AppContainer exp={{}} />);
    const errorBoundaryInstance: ReactTestInstance = testInstance.root
      .children[0] as ReactTestInstance;

    expect(errorBoundaryInstance.type).not.toEqual(RootErrorBoundary);
  });

  withDEV(false, () => {
    const testInstance = renderer.create(<AppContainer exp={{}} />);
    const errorBoundaryInstance: ReactTestInstance = testInstance.root
      .children[0] as ReactTestInstance;

    expect(errorBoundaryInstance.type).not.toEqual(RootErrorBoundary);
  });
});

function App() {
  return <AppLoading />;
}

const AppContainer = withExpoRoot(App);
