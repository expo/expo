import { screen, waitFor } from '@testing-library/react-native';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { renderRouter } from '../../testing-library';
import { useNavigationContainerRef } from '../useNavigationContainerRef';
import { useRootNavigation } from '../useRootNavigation';

function NavigationRefProbe() {
  const rootNavigation = useRootNavigation();
  const navigationRef = useNavigationContainerRef();
  const [state, setState] = useState({ root: false, ref: false });

  useEffect(() => {
    setState({
      root: typeof rootNavigation?.navigate === 'function',
      ref: typeof navigationRef.current?.navigate === 'function',
    });
  }, [navigationRef, rootNavigation]);

  return (
    <>
      <Text testID="root-navigation">{String(state.root)}</Text>
      <Text testID="navigation-ref">{String(state.ref)}</Text>
    </>
  );
}

it('returns the root navigation object and container ref', async () => {
  renderRouter({
    index: NavigationRefProbe,
  });

  await waitFor(() => expect(screen.getByTestId('root-navigation')).toHaveTextContent('true'));
  expect(screen.getByTestId('navigation-ref')).toHaveTextContent('true');
});
