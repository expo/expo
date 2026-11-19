import { act, render } from '@testing-library/react-native';
import { Activity } from 'react';

import {
  CompositionActivityScope,
  CompositionContext,
  useCompositionOption,
  useCompositionRegistry,
} from '../CompositionOptionsContext';
import type { CompositionRegistry } from '../types';

jest.mock('../../../../views/useSafeLayoutEffect', () => ({
  useSafeLayoutEffect: require('react').useLayoutEffect,
}));

jest.mock('../../../../react-navigation/native', () => {
  const actual = jest.requireActual(
    '../../../../react-navigation/native'
  ) as typeof import('../../../../react-navigation/native');
  return {
    ...actual,
    useRoute: () => ({ key: 'test-route', name: 'test' }),
  };
});

describe('CompositionActivityScope', () => {
  it('keeps options while the route is hidden', async () => {
    const routes = [{ key: 'test-route' }];
    const options = { title: 'Toolbar' };
    let registry: CompositionRegistry = {};
    function Toolbar() {
      useCompositionOption(options);
      return null;
    }
    function Navigator({ mode }: { mode: 'visible' | 'hidden' }) {
      const composition = useCompositionRegistry(routes);
      registry = composition.registry;
      return (
        <CompositionContext value={composition.contextValue}>
          <Activity mode={mode}>
            <CompositionActivityScope>
              <Toolbar />
            </CompositionActivityScope>
          </Activity>
        </CompositionContext>
      );
    }

    const { rerender } = await render(<Navigator mode="visible" />);
    await act(() => rerender(<Navigator mode="hidden" />));

    expect(registry).toEqual({ 'test-route': [options] });
  });

  it('removes options of a component unmounted while the route was hidden', async () => {
    const routes = [{ key: 'test-route' }];
    const options = { title: 'Toolbar' };
    let registry: CompositionRegistry = {};
    function Toolbar() {
      useCompositionOption(options);
      return null;
    }
    function Navigator({ mode, toolbar }: { mode: 'visible' | 'hidden'; toolbar: boolean }) {
      const composition = useCompositionRegistry(routes);
      registry = composition.registry;
      return (
        <CompositionContext value={composition.contextValue}>
          <Activity mode={mode}>
            <CompositionActivityScope>{toolbar && <Toolbar />}</CompositionActivityScope>
          </Activity>
        </CompositionContext>
      );
    }

    const { rerender } = await render(<Navigator mode="visible" toolbar />);
    await act(() => rerender(<Navigator mode="hidden" toolbar />));
    await act(() => rerender(<Navigator mode="hidden" toolbar={false} />));

    expect(registry).toEqual({ 'test-route': [options] });

    await act(() => rerender(<Navigator mode="visible" toolbar={false} />));

    expect(registry).toEqual({});
  });
});
