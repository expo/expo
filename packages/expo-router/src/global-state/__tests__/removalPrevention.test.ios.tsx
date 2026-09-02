import { act, render } from '@testing-library/react-native';
import * as React from 'react';
import { use } from 'react';

import {
  GlobalRoutesWithRemovalPreventedContext,
  GlobalRemovalEventEmitterRegistryContext,
  isRouteRemovalPrevented,
  PreventRemovalProvider,
  RemovalPreventionProvider,
  ScreenRemovalPreventionSetterContext,
} from '../removalPrevention';

test('aggregates prevention across routes', () => {
  const setters = new Map<string, (id: string, isPrevented: boolean) => void>();
  const routes: ReadonlySet<string>[] = [];
  function Capture({ routeKey }: { routeKey: string }) {
    setters.set(routeKey, use(ScreenRemovalPreventionSetterContext)!);
    return null;
  }
  function RoutesCapture() {
    routes.push(use(GlobalRoutesWithRemovalPreventedContext)!);
    return null;
  }
  render(
    <RemovalPreventionProvider>
      <PreventRemovalProvider routeKey="a">
        <Capture routeKey="a" />
      </PreventRemovalProvider>
      <PreventRemovalProvider routeKey="b">
        <Capture routeKey="b" />
      </PreventRemovalProvider>
      <RoutesCapture />
    </RemovalPreventionProvider>
  );

  act(() => {
    setters.get('a')!('first', true);
    setters.get('b')!('first', true);
  });
  expect(routes.at(-1)).toEqual(new Set(['a', 'b']));

  act(() => setters.get('a')!('first', false));
  expect(routes.at(-1)).toEqual(new Set(['b']));

  act(() => setters.get('b')!('first', false));
  expect(routes.at(-1)).toEqual(new Set());
});

test('detects prevention in an active descendant but not a preloaded route', () => {
  const route = {
    key: 'parent',
    name: 'parent',
    state: {
      stale: false as const,
      type: 'stack',
      key: 'stack',
      routeKeySeq: 0,
      index: 0,
      routeNames: ['active', 'preloaded'],
      routes: [
        { key: 'active', name: 'active' },
        { key: 'preloaded', name: 'preloaded' },
      ],
    },
  };

  expect(isRouteRemovalPrevented(route, new Set(['active']))).toBe(true);
  expect(isRouteRemovalPrevented(route, new Set(['preloaded']))).toBe(false);
  expect(isRouteRemovalPrevented(route, new Set(['parent']))).toBe(true);
});

test('keeps a route emitter until the end of the task after its provider unmounts', async () => {
  const action = { type: 'POP' };
  const emitRemovalEvent = jest.fn();
  let registry = null as React.ContextType<typeof GlobalRemovalEventEmitterRegistryContext>;
  function CaptureRegistry() {
    registry = use(GlobalRemovalEventEmitterRegistryContext);
    return null;
  }
  function Tree({ mounted }: { mounted: boolean }) {
    return (
      <RemovalPreventionProvider>
        <CaptureRegistry />
        {mounted && <PreventRemovalProvider routeKey="x" emitRemovalEvent={emitRemovalEvent} />}
      </RemovalPreventionProvider>
    );
  }
  const result = render(<Tree mounted />);

  result.rerender(<Tree mounted={false} />);
  registry!.emitRemovalEvent('x', 'removed', action);
  expect(emitRemovalEvent).toHaveBeenCalledWith('x', 'removed', action);

  await act(() => Promise.resolve());
  registry!.emitRemovalEvent('x', 'removed', action);
  expect(emitRemovalEvent).toHaveBeenCalledTimes(1);
});
