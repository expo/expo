import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import type { NavNode } from '../../types';
import { NavNodeProvider, useNavNodeSlice } from '../navNodeContext';

// R-Phase B — the slice handoff (Decisions R-2).

function Probe() {
  const node = useNavNodeSlice();
  return <Text testID="key">{node.key}</Text>;
}

const node: NavNode = { key: 'home.stack', index: 0, routes: [{ key: 'index#0', name: 'index' }] };

it('provides the NavNode slice to descendants', () => {
  render(
    <NavNodeProvider node={node}>
      <Probe />
    </NavNodeProvider>
  );
  expect(screen.getByTestId('key')).toHaveTextContent('home.stack');
});

it('a nested provider overrides with the child slice (recursion handoff)', () => {
  const child: NavNode = { key: 'inner', index: 0, routes: [{ key: 'a#0', name: 'a' }] };
  render(
    <NavNodeProvider node={node}>
      <NavNodeProvider node={child}>
        <Probe />
      </NavNodeProvider>
    </NavNodeProvider>
  );
  expect(screen.getByTestId('key')).toHaveTextContent('inner');
});

it('throws outside a provider', () => {
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  expect(() => render(<Probe />)).toThrow('must be used within a NavNodeProvider');
  spy.mockRestore();
});
