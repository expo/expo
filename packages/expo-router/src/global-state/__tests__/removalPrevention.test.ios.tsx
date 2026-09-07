import { act, render } from '@testing-library/react-native';
import * as React from 'react';
import { use } from 'react';

import { IsPreloadedContext } from '../../react-navigation/core/IsPreloadedContext';
import {
  GlobalRoutesWithRemovalPreventedContext,
  GlobalRemovalEventEmitterRegistryContext,
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

test('propagates prevention from a child route to its parent route', () => {
  let setChildPrevented: React.ContextType<typeof ScreenRemovalPreventionSetterContext>;
  const routes: ReadonlySet<string>[] = [];
  function CaptureChildSetter() {
    setChildPrevented = use(ScreenRemovalPreventionSetterContext);
    return null;
  }
  function RoutesCapture() {
    routes.push(use(GlobalRoutesWithRemovalPreventedContext)!);
    return null;
  }
  render(
    <RemovalPreventionProvider>
      <PreventRemovalProvider routeKey="parent">
        <PreventRemovalProvider routeKey="child">
          <CaptureChildSetter />
        </PreventRemovalProvider>
      </PreventRemovalProvider>
      <RoutesCapture />
    </RemovalPreventionProvider>
  );

  act(() => setChildPrevented!('guard', true));
  expect(routes.at(-1)).toEqual(new Set(['child', 'parent']));

  act(() => setChildPrevented!('guard', false));
  expect(routes.at(-1)).toEqual(new Set());
});

test('does not register prevention for a preloaded child route and re-registers when active', () => {
  const routes: ReadonlySet<string>[] = [];
  function Guard() {
    const setPrevented = use(ScreenRemovalPreventionSetterContext)!;
    React.useLayoutEffect(() => {
      setPrevented('guard', true);
      return () => setPrevented('guard', false);
    }, [setPrevented]);
    return null;
  }
  function RoutesCapture() {
    routes.push(use(GlobalRoutesWithRemovalPreventedContext)!);
    return null;
  }
  function Tree({ isPreloaded }: { isPreloaded: boolean }) {
    return (
      <RemovalPreventionProvider>
        <PreventRemovalProvider routeKey="parent">
          <IsPreloadedContext value={isPreloaded}>
            <PreventRemovalProvider routeKey="child">
              <Guard />
            </PreventRemovalProvider>
          </IsPreloadedContext>
        </PreventRemovalProvider>
        <RoutesCapture />
      </RemovalPreventionProvider>
    );
  }
  const result = render(<Tree isPreloaded />);
  expect(routes.at(-1)).toEqual(new Set());

  result.rerender(<Tree isPreloaded={false} />);
  expect(routes.at(-1)).toEqual(new Set(['child', 'parent']));

  result.rerender(<Tree isPreloaded />);
  expect(routes.at(-1)).toEqual(new Set());
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
