import { act, renderHook } from '@testing-library/react-native';
import { useLayoutEffect } from 'react';

import type { RouteNode } from '../../Route';
import {
  DrawerRouter,
  StackRouter,
  TabRouter,
  type NavigationState,
} from '../../react-navigation/routers';
import { createSeededRootState } from '../createSeededNavigationState';
import type { RouterRegistry, RouterRegistryEntry } from '../routerRegistry';
import { useNavigationTreeReducer } from '../useNavigationTreeReducer';
import { node } from './__fixtures__/routeNode';

function mounted(
  factory: typeof TabRouter | typeof DrawerRouter | typeof StackRouter,
  routeNode: RouteNode
): RouterRegistryEntry {
  const router = factory({});
  const names = routeNode.children.map((child) => child.route).reverse();
  return {
    routeNode,
    routerType: router.type,
    reduce: (state, action) =>
      router.getStateForAction(state as never, action as never, {
        routeNames: names,
        routeGetIdList: {},
      }),
    getStateForRouteConfigChange: jest.fn((state, routeNames, repairHistory) =>
      router.getStateForRouteConfigChange(state as never, {
        routeNames,
        declaredRouteNames: routeNames,
        repairHistory,
      })
    ),
  };
}

function renderTree(
  routeNode: RouteNode,
  state = createSeededRootState(undefined, routeNode),
  registry: RouterRegistry = new Map()
) {
  const commits: NavigationState[] = [];
  const result = renderHook(
    ({ routeNode, registry }: { routeNode: RouteNode; registry: RouterRegistry }) => {
      const result = useNavigationTreeReducer({ initialState: state, routeNode, registry });
      useLayoutEffect(() => {
        commits.push(result.state);
      }, [result.state]);
      return result;
    },
    { initialProps: { routeNode, registry } }
  );
  const consume = () =>
    act(() =>
      result.result.current.consumeReportEvents(
        result.result.current.report?.events.map((event) => event.id) ?? []
      )
    );
  return { ...result, consume, commits };
}

export function routeConfigGuards(browser = false) {
  it.each([TabRouter, DrawerRouter])(
    'does not repair or write state/history on normal registration',
    (factory) => {
      const routeNode = node('', [node('index'), node('second')]);
      const test = renderTree(routeNode);
      test.consume();
      const before = test.result.current.state;
      const child = before.routes[0]!.state!;
      expect(child.history).toBeUndefined();
      const entry = mounted(factory, routeNode);
      test.rerender({ routeNode, registry: new Map([[child.key!, entry]]) });
      expect(test.result.current.state).toBe(before);
      expect(test.result.current.report).toBeUndefined();
      expect(entry.getStateForRouteConfigChange).not.toHaveBeenCalled();
      expect(test.commits).toHaveLength(1);
    }
  );

  it.each([TabRouter, DrawerRouter])(
    'does not add registration effects after pushing a nested navigator',
    (factory) => {
      const nested = node('nested', [node('index'), node('second')]);
      const routeNode = node('', [node('index'), nested]);
      const initial = createSeededRootState(undefined, routeNode);
      const key = initial.routes[0]!.state!.key!;
      const outer = mounted(StackRouter, routeNode);
      const registry = new Map([[key, outer]]);
      const test = renderTree(routeNode, initial, registry);
      test.consume();
      act(() =>
        test.result.current.handleAction({ type: 'PUSH', target: key, payload: { name: 'nested' } })
      );
      test.consume();
      const before = test.result.current.state;
      const layout = before.routes[0]!.state!;
      const child = layout.routes[layout.index!]!.state!;
      expect(child.history).toBeUndefined();
      const entry = mounted(factory, nested);
      test.rerender({ routeNode, registry: new Map([...registry, [child.key!, entry]]) });
      expect(test.result.current.state).toBe(before);
      expect(test.result.current.report).toBeUndefined();
      expect(entry.getStateForRouteConfigChange).not.toHaveBeenCalled();
      expect(test.commits).toHaveLength(2);
    }
  );

  it('keeps key allocation monotonic when a surviving navigator unmounts', () => {
    const routeNode = node('', [node('index'), node('second')]);
    const seeded = createSeededRootState(undefined, routeNode);
    const child = seeded.routes[0]!.state! as NavigationState;
    const state = {
      ...seeded,
      routes: [{ ...seeded.routes[0]!, state: { ...child, routeKeySeq: 8 } }],
    };
    const entry = mounted(StackRouter, routeNode);
    const test = renderTree(routeNode, state, new Map([[child.key, entry]]));
    test.consume();
    test.rerender({ routeNode, registry: new Map() });
    const reset = test.result.current.state.routes[0]!.state!;
    expect(reset.routeKeySeq).toBeGreaterThan(8);
    expect(reset.routes[0]!.key).not.toBe(child.routes[0]!.key);
    expect(test.result.current.state.routes[0]!.key).toBe(state.routes[0]!.key);
  });

  if (browser)
    it('repairs old browser snapshots without restoring deleted routes or creating visits', () => {
      const routeNode = node('', [node('index'), node('second'), node('third')]);
      const initial = createSeededRootState(undefined, routeNode);
      const child = initial.routes[0]!.state!;
      const rootRouter = StackRouter({});
      const rootEntry: RouterRegistryEntry = {
        reduce: (state, action) =>
          rootRouter.getStateForAction(state as never, action as never, {
            routeNames: state.routeNames,
            routeGetIdList: {},
          }),
      };
      const registry = new Map([
        [initial.key, rootEntry],
        [child.key!, mounted(StackRouter, routeNode)],
      ]);
      const test = renderTree(routeNode, initial, registry);
      act(() =>
        test.result.current.handleAction({
          type: 'PUSH',
          target: child.key,
          payload: { name: 'second' },
        })
      );
      const second = test.result.current.report!.events.find(
        (event) => event.type === 'browser-history' && event.op === 'push'
      );
      if (second?.type !== 'browser-history' || second.op === 'go')
        throw new Error('Missing second browser entry');
      act(() =>
        test.result.current.handleAction({
          type: 'PUSH',
          target: child.key,
          payload: { name: 'third' },
        })
      );
      test.consume();
      const changed = node('', [node('index'), node('third')]);
      test.rerender({ routeNode: changed, registry });
      expect(
        test.result.current.report!.events.filter((event) => event.type === 'browser-history')
      ).toEqual([expect.objectContaining({ op: 'replace', path: '/third' })]);
      test.consume();
      act(() =>
        test.result.current.processIntent({
          type: 'BROWSER_HISTORY_CHANGED',
          payload: { id: second.entryId, path: second.path },
        })
      );
      const restored = test.result.current.state.routes[0]!.state!;
      expect(restored.routeNames).toEqual(['index', 'third']);
      expect(restored.routes.map((route) => route.name)).toEqual(['index']);
      expect(
        test.result.current.report!.events.filter((event) => event.type === 'browser-history')
      ).toEqual([
        expect.objectContaining({ op: 'replace', entryId: second.entryId, path: '/index' }),
      ]);
    });

  it('consumes pending adoption once without state or report effects and survives replay', () => {
    const initialNode = node('', [node('index'), node('second')]);
    const test = renderTree(initialNode);
    test.consume();
    const changed = node('', [node('index'), node('third')]);
    test.rerender({ routeNode: changed, registry: new Map() });
    test.consume();
    const before = test.result.current.state;
    const child = before.routes[0]!.state!;
    const entry = mounted(TabRouter, changed);
    const registry = new Map([[child.key!, entry]]);
    test.rerender({ routeNode: changed, registry });
    expect(entry.getStateForRouteConfigChange).toHaveBeenCalledTimes(1);
    expect(test.result.current.state).toBe(before);
    expect(test.result.current.report).toBeUndefined();
    test.rerender({
      routeNode: node('', [node('index'), node('third')]),
      registry: new Map(registry),
    });
    expect(entry.getStateForRouteConfigChange).toHaveBeenCalledTimes(1);
    expect(test.result.current.state).toBe(before);
  });

  it('reports removed routes once after repair and ignores late cleanup and type changes', () => {
    const nested = node('index', [node('child')]);
    const initialNode = node('', [nested]);
    const initial = createSeededRootState(undefined, initialNode);
    const removed = initial.routes[0]!.state!.routes[0]!.state!;
    const oldEntry = mounted(StackRouter, nested);
    const registry = new Map([[removed.key!, oldEntry]]);
    const test = renderTree(initialNode, initial, registry);
    test.consume();
    const leaf = node('', [node('index')]);
    test.rerender({ routeNode: leaf, registry });
    expect(
      test.result.current.report?.events.filter((event) => event.type !== 'browser-history')
    ).toEqual([
      expect.objectContaining({
        type: 'removed-routes',
        routeKeys: [removed.routes[0]!.key],
        action: { type: 'HMR_CONFIG_CHANGED' },
      }),
    ]);
    test.consume();
    const repaired = test.result.current.state;
    act(() => test.result.current.resetNavigator(removed.key!, 'tab'));
    test.rerender({ routeNode: leaf, registry: new Map() });
    expect(test.result.current.state).toBe(repaired);
    expect(test.result.current.report).toBeUndefined();
    expect(test.result.current.state.routes[0]!.state!.routes[0]!.state).toBeUndefined();
  });
}
