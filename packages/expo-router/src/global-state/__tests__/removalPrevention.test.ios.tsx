import { act, render, renderHook } from '@testing-library/react-native';
import * as React from 'react';
import { act as reactAct, use, useState } from 'react';

import { IsPreloadedContext } from '../../react-navigation/core/IsPreloadedContext';
import {
  GlobalRoutesWithRemovalPreventedContext,
  GlobalRemovalEventEmitterRegistryContext,
  PreventRemovalProvider,
  RemovalPreventionProvider,
  ScreenRemovalPreventionSetterContext,
} from '../removalPrevention';

test('aggregates prevention across routes', async () => {
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
  await render(
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

  await act(() => {
    setters.get('a')!('first', true);
    setters.get('b')!('first', true);
  });
  expect(routes.at(-1)).toEqual(new Set(['a', 'b']));

  await act(() => setters.get('a')!('first', false));
  expect(routes.at(-1)).toEqual(new Set(['b']));

  await act(() => setters.get('b')!('first', false));
  expect(routes.at(-1)).toEqual(new Set());
});

test('propagates prevention from a child route to its parent route', async () => {
  const wrapper = ({ children }: React.PropsWithChildren) => (
    <RemovalPreventionProvider>
      <PreventRemovalProvider routeKey="parent">
        <PreventRemovalProvider routeKey="child">{children}</PreventRemovalProvider>
      </PreventRemovalProvider>
    </RemovalPreventionProvider>
  );

  const { result } = await renderHook(
    () => ({
      setPrevented: use(ScreenRemovalPreventionSetterContext)!,
      preventedRoutes: use(GlobalRoutesWithRemovalPreventedContext)!,
    }),
    { wrapper }
  );

  await act(() => result.current.setPrevented('guard', true));
  expect(result.current.preventedRoutes).toEqual(new Set(['child', 'parent']));

  await act(() => result.current.setPrevented('guard', false));
  expect(result.current.preventedRoutes).toEqual(new Set());
});

test('updates prevention when a child route becomes active or preloaded', async () => {
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

  const result = await render(<Tree isPreloaded />);
  expect(routes.at(-1)).toEqual(new Set());

  await result.rerender(<Tree isPreloaded={false} />);
  expect(routes.at(-1)).toEqual(new Set(['child', 'parent']));

  await result.rerender(<Tree isPreloaded />);
  expect(routes.at(-1)).toEqual(new Set());
});

test('keeps a parent prevented while either child prevents removal with the same id', async () => {
  const setters = new Map<string, (id: string, isPrevented: boolean) => void>();
  function Capture({ routeKey }: { routeKey: string }) {
    setters.set(routeKey, use(ScreenRemovalPreventionSetterContext)!);
    return null;
  }
  const wrapper = ({ children }: React.PropsWithChildren) => (
    <RemovalPreventionProvider>
      <PreventRemovalProvider routeKey="parent">
        <PreventRemovalProvider routeKey="child-a">
          <Capture routeKey="child-a" />
        </PreventRemovalProvider>
        <PreventRemovalProvider routeKey="child-b">
          <Capture routeKey="child-b" />
        </PreventRemovalProvider>
      </PreventRemovalProvider>
      {children}
    </RemovalPreventionProvider>
  );
  const { result } = await renderHook(() => use(GlobalRoutesWithRemovalPreventedContext)!, {
    wrapper,
  });

  await act(() => {
    setters.get('child-a')!('guard', true);
    setters.get('child-b')!('guard', true);
  });
  await act(() => setters.get('child-a')!('guard', false));

  expect(result.current).toEqual(new Set(['child-b', 'parent']));
});

test('propagates prevention through every ancestor route', async () => {
  const wrapper = ({ children }: React.PropsWithChildren) => (
    <RemovalPreventionProvider>
      <PreventRemovalProvider routeKey="grandparent">
        <PreventRemovalProvider routeKey="parent">
          <PreventRemovalProvider routeKey="child">{children}</PreventRemovalProvider>
        </PreventRemovalProvider>
      </PreventRemovalProvider>
    </RemovalPreventionProvider>
  );
  const { result } = await renderHook(
    () => ({
      setPrevented: use(ScreenRemovalPreventionSetterContext)!,
      preventedRoutes: use(GlobalRoutesWithRemovalPreventedContext)!,
    }),
    { wrapper }
  );

  await act(() => result.current.setPrevented('guard', true));

  expect(result.current.preventedRoutes).toEqual(new Set(['child', 'parent', 'grandparent']));
});

test('registers prevention for a preloaded child route when requested', async () => {
  const wrapper = ({ children }: React.PropsWithChildren) => (
    <RemovalPreventionProvider>
      <PreventRemovalProvider routeKey="parent">
        <IsPreloadedContext value>
          <PreventRemovalProvider routeKey="child">{children}</PreventRemovalProvider>
        </IsPreloadedContext>
      </PreventRemovalProvider>
    </RemovalPreventionProvider>
  );
  const { result } = await renderHook(
    () => ({
      setPrevented: use(ScreenRemovalPreventionSetterContext)!,
      preventedRoutes: use(GlobalRoutesWithRemovalPreventedContext)!,
    }),
    { wrapper }
  );

  await act(() => result.current.setPrevented('guard', true, true));

  expect(result.current.preventedRoutes).toEqual(new Set(['child', 'parent']));
});

test('keeps a route emitter until the end of the task after its provider unmounts', async () => {
  const action = { type: 'POP' };
  const emitRemovalEvent = jest.fn();
  let registry = null as React.ContextType<typeof GlobalRemovalEventEmitterRegistryContext>;
  let setMounted!: (mounted: boolean) => void;
  function CaptureRegistry() {
    registry = use(GlobalRemovalEventEmitterRegistryContext);
    return null;
  }
  function Tree() {
    const [mounted, setMountedState] = useState(true);
    setMounted = setMountedState;
    return (
      <RemovalPreventionProvider>
        <CaptureRegistry />
        {mounted && <PreventRemovalProvider routeKey="x" emitRemovalEvent={emitRemovalEvent} />}
      </RemovalPreventionProvider>
    );
  }
  await render(<Tree />);

  // Unmount synchronously so the emitter can be observed before the microtask that drops it runs.
  reactAct(() => setMounted(false));
  registry!.emitRemovalEvent('x', 'removed', action);
  expect(emitRemovalEvent).toHaveBeenCalledWith('x', 'removed', action);

  await act(() => Promise.resolve());
  registry!.emitRemovalEvent('x', 'removed', action);
  expect(emitRemovalEvent).toHaveBeenCalledTimes(1);
});
