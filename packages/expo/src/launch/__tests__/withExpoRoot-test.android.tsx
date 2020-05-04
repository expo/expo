import * as React from 'react';
import renderer, { ReactTestInstance } from 'react-test-renderer';

import AppLoading from '../AppLoading';
import RootErrorBoundary from '../RootErrorBoundary';
import withExpoRoot from '../withExpoRoot';
import { withDEV, catchErrorSilently } from './utils';

it('renders RootErrorBondary in DEV and it catches the error', () => {
  withDEV(true, () => {
    const testInstance = renderer.create(<AppContainer exp={{}} />);
    const errorBoundaryInstance: ReactTestInstance = testInstance.root
      .children[0] as ReactTestInstance;

    expect(errorBoundaryInstance.type).toEqual(RootErrorBoundary);
    expect(errorBoundaryInstance.instance.state).toEqual({ error: null });

    catchErrorSilently(() => {
      renderer.act(() => {
        testInstance.update(<AppContainer exp={{}} throwError />);
      });
    });

    expect(errorBoundaryInstance.instance.state).toEqual({ error: true });
  });
});

it('does not render RootErrorBoundary if DEV is false', () => {
  withDEV(false, () => {
    const testInstance = renderer.create(<AppContainer exp={{}} />);
    const errorBoundaryInstance: ReactTestInstance = testInstance.root
      .children[0] as ReactTestInstance;

    expect(errorBoundaryInstance.type).not.toEqual(RootErrorBoundary);
  });
});

function App(props: any) {
  if (props.throwError) {
    throw new Error('Simulated error');
  }
  return <AppLoading />;
}

const AppContainer = withExpoRoot(App);
