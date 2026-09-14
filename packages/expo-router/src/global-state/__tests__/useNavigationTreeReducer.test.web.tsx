import { act, renderHook } from '@testing-library/react-native';

import { type NavigationState, StackRouter } from '../../react-navigation/routers';
import type { RouterRegistry } from '../routerRegistry';
import { useNavigationTreeReducer } from '../useNavigationTreeReducer';
import { entry } from './__fixtures__/routerEntry';

jest.mock('../getPathForState', () => ({
  getPathForState: (state: NavigationState) => `/${state.routes[state.index]!.name}`,
}));

const initialState: NavigationState = {
  stale: false,
  type: 'stack',
  key: 'root',
  routeKeySeq: 0,
  index: 0,
  routeNames: ['first', 'second', 'third'],
  routes: [{ key: 'first', name: 'first' }],
};

const registry: RouterRegistry = new Map([
  ['root', entry(StackRouter({}), ['first', 'second', 'third'])],
]);

function renderReducer() {
  return renderHook(() => useNavigationTreeReducer({ initialState, registry }));
}

function browserEvents(result: ReturnType<typeof renderReducer>) {
  return result.result.current.report?.events.filter((event) => event.type === 'browser-history');
}

test('seeds the report with a replace for the initial entry', () => {
  const result = renderReducer();

  expect(browserEvents(result)).toEqual([
    {
      id: 0,
      type: 'browser-history',
      op: 'replace',
      entryId: expect.stringMatching(/:0$/),
      path: '/first',
    },
  ]);
});

test('emits a push after an action that grows the stack', () => {
  const result = renderReducer();

  act(() =>
    result.result.current.handleAction({
      type: 'PUSH',
      payload: { name: 'second' },
    })
  );

  expect(result.result.current.state.routes).toHaveLength(2);
  expect(browserEvents(result)?.at(-1)).toEqual({
    id: expect.any(Number),
    type: 'browser-history',
    op: 'push',
    entryId: expect.stringMatching(/:1$/),
    path: '/second',
  });
});

test('emits one push per action in a batch', () => {
  const result = renderReducer();

  act(() => {
    result.result.current.handleAction({
      type: 'PUSH',
      payload: { name: 'second' },
    });
    result.result.current.handleAction({
      type: 'PUSH',
      payload: { name: 'third' },
    });
  });

  expect(browserEvents(result)?.filter((event) => event.op === 'push')).toEqual([
    expect.objectContaining({ op: 'push', path: '/second' }),
    expect.objectContaining({ op: 'push', path: '/third' }),
  ]);
});

test('restores an owned entry on a browser change without browser commands', () => {
  const result = renderReducer();
  const initialEntryId = browserEvents(result)![0]!;
  act(() =>
    result.result.current.handleAction({
      type: 'PUSH',
      payload: { name: 'second' },
    })
  );
  const eventsBefore = result.result.current.report!.events.length;

  act(() =>
    result.result.current.processIntent({
      type: 'BROWSER_HISTORY_CHANGED',
      payload: {
        id: initialEntryId.op === 'go' ? null : initialEntryId.entryId,
        path: '/first',
      },
    })
  );

  expect(result.result.current.state.routes).toEqual([{ key: 'first', name: 'first' }]);
  const newEvents = result.result.current.report!.events.slice(eventsBefore);
  expect(newEvents.map((event) => event.type)).toEqual(['removed-routes', 'action-dispatched']);
});

test('prunes consumed browser history events', () => {
  const result = renderReducer();

  act(() => result.result.current.consumeReportEvents([0]));

  expect(result.result.current.report).toBeUndefined();
});
