import { act } from '@testing-library/react-native';
import { Text } from 'react-native';

import { router } from '../../imperative-api';
import Tabs from '../../layouts/Tabs';
import { renderRouter } from '../../testing-library';
import { unstable_navigationEvents } from '../index';
import type { AnalyticsEvent } from '../index';
import {
  appendRouteToFocusedState,
  buildScreenListeners,
  buildStackListeners,
  buildTabListeners,
  mergeListeners,
} from '../withNavigationEvents';

type RecordedEvent = AnalyticsEvent & { type: AnalyticsEvent['type'] };

function recordEvents() {
  const events: RecordedEvent[] = [];
  const reset = () => {
    events.length = 0;
  };
  const offs = (
    ['pageWillAppear', 'pageAppeared', 'pageWillDisappear', 'pageDisappeared'] as const
  ).map((type) =>
    unstable_navigationEvents.addListener(type, (event) => {
      events.push({ type, ...event } as RecordedEvent);
    })
  );
  return {
    events,
    reset,
    cleanup: () => offs.forEach((off) => off()),
  };
}

const fakeRoute = { key: 'route-key-1', name: 'index', params: { foo: 'bar' } } as any;
const fakeNavigation = {} as any;
const noopRef = { current: undefined };

it.each(['pageWillAppear', 'pageAppeared', 'pageWillDisappear', 'pageDisappeared'] as const)(
  'returns cleanup for %s',
  (type) => {
    const off = unstable_navigationEvents.addListener(type, () => {});
    expect(typeof off).toBe('function');
    off();
  }
);

describe('withTabNavigationEvents', () => {
  let events: RecordedEvent[];
  let reset: () => void;
  let cleanup: () => void;

  beforeAll(() => {
    unstable_navigationEvents.enable();
  });

  beforeEach(() => {
    ({ events, reset, cleanup } = recordEvents());
  });

  afterEach(() => {
    cleanup();
  });

  it('emits pageDisappeared on the leaving tab and pageAppeared on the entering tab when navigating', () => {
    renderRouter(
      {
        _layout: () => <Tabs />,
        one: () => <Text>One</Text>,
        two: () => <Text>Two</Text>,
      },
      { initialUrl: '/one' }
    );

    expect(events).toEqual([
      {
        type: 'pageAppeared',
        params: {},
        pathname: '/__root/one',
        screenId: expect.any(String),
      },
    ]);

    reset();

    act(() => router.navigate('/two'));

    expect(events).toEqual([
      {
        type: 'pageDisappeared',
        params: {},
        pathname: '/__root/one',
        screenId: expect.any(String),
      },
      {
        type: 'pageAppeared',
        params: {},
        pathname: '/__root/two',
        screenId: expect.any(String),
      },
    ]);
    // screenIds must differ between tabs
    expect(events[0].screenId).not.toBe(events[1].screenId);
  });

  it('does not emit when navigation events are disabled', () => {
    const isEnabledSpy = jest.spyOn(unstable_navigationEvents, 'isEnabled').mockReturnValue(false);

    renderRouter(
      {
        _layout: () => <Tabs />,
        a: () => <Text>A</Text>,
        b: () => <Text>B</Text>,
      },
      { initialUrl: '/a' }
    );

    act(() => router.navigate('/b'));

    expect(events).toHaveLength(0);

    isEnabledSpy.mockRestore();
  });
});

describe('buildStackListeners', () => {
  let events: RecordedEvent[];
  let cleanup: () => void;

  beforeAll(() => {
    unstable_navigationEvents.enable();
  });

  beforeEach(() => {
    ({ events, cleanup } = recordEvents());
  });

  afterEach(() => {
    cleanup();
  });

  it('returns transitionStart and transitionEnd listeners', () => {
    const listeners = buildStackListeners(noopRef, fakeRoute);
    expect(Object.keys(listeners).sort()).toEqual(['transitionEnd', 'transitionStart']);
  });

  it('transitionStart with closing=false emits pageWillAppear', () => {
    const listeners = buildStackListeners(noopRef, fakeRoute);
    listeners.transitionStart({ data: { closing: false } } as any);
    expect(events.map((e) => e.type)).toEqual(['pageWillAppear']);
    expect(events[0].screenId).toBe(fakeRoute.key);
  });

  it('transitionStart with closing=true emits pageWillDisappear', () => {
    const listeners = buildStackListeners(noopRef, fakeRoute);
    listeners.transitionStart({ data: { closing: true } } as any);
    expect(events.map((e) => e.type)).toEqual(['pageWillDisappear']);
  });

  it('transitionEnd with closing=false emits pageAppeared', () => {
    const listeners = buildStackListeners(noopRef, fakeRoute);
    listeners.transitionEnd({ data: { closing: false } } as any);
    expect(events.map((e) => e.type)).toEqual(['pageAppeared']);
  });

  it('transitionEnd with closing=true emits pageDisappeared', () => {
    const listeners = buildStackListeners(noopRef, fakeRoute);
    listeners.transitionEnd({ data: { closing: true } } as any);
    expect(events.map((e) => e.type)).toEqual(['pageDisappeared']);
  });

  it('does not emit when navigationEvents is disabled', () => {
    const isEnabledSpy = jest.spyOn(unstable_navigationEvents, 'isEnabled').mockReturnValue(false);

    const listeners = buildStackListeners(noopRef, fakeRoute);
    listeners.transitionStart({ data: { closing: false } } as any);
    listeners.transitionEnd({ data: { closing: false } } as any);

    expect(events).toHaveLength(0);

    isEnabledSpy.mockRestore();
  });
});

describe('buildTabListeners', () => {
  let events: RecordedEvent[];
  let cleanup: () => void;

  beforeAll(() => {
    unstable_navigationEvents.enable();
  });

  beforeEach(() => {
    ({ events, cleanup } = recordEvents());
  });

  afterEach(() => {
    cleanup();
  });

  it('returns focus and blur listeners', () => {
    const listeners = buildTabListeners(noopRef, fakeRoute);
    expect(Object.keys(listeners).sort()).toEqual(['blur', 'focus']);
  });

  it('focus emits pageAppeared', () => {
    const listeners = buildTabListeners(noopRef, fakeRoute);
    listeners.focus({} as any);
    expect(events.map((e) => e.type)).toEqual(['pageAppeared']);
    expect(events[0].screenId).toBe(fakeRoute.key);
  });

  it('blur emits pageDisappeared', () => {
    const listeners = buildTabListeners(noopRef, fakeRoute);
    listeners.blur({} as any);
    expect(events.map((e) => e.type)).toEqual(['pageDisappeared']);
  });

  it('does not emit when navigationEvents is disabled', () => {
    const isEnabledSpy = jest.spyOn(unstable_navigationEvents, 'isEnabled').mockReturnValue(false);

    const listeners = buildTabListeners(noopRef, fakeRoute);
    listeners.focus({} as any);
    listeners.blur({} as any);

    expect(events).toHaveLength(0);

    isEnabledSpy.mockRestore();
  });
});

describe('mergeListeners', () => {
  it('returns ours when no user listeners are supplied', () => {
    const ourFocus = jest.fn();
    const merged = mergeListeners(undefined, { focus: ourFocus })({
      route: fakeRoute,
      navigation: fakeNavigation,
    });

    expect(Object.keys(merged)).toEqual(['focus']);
    merged.focus!({} as any);
    expect(ourFocus).toHaveBeenCalledTimes(1);
  });

  it('object form: user fn fires before ours', () => {
    const calls: string[] = [];
    const userFocus = jest.fn(() => calls.push('user'));
    const ourFocus = jest.fn(() => calls.push('ours'));

    const merged = mergeListeners({ focus: userFocus } as any, { focus: ourFocus })({
      route: fakeRoute,
      navigation: fakeNavigation,
    });

    merged.focus!({} as any);
    expect(calls).toEqual(['user', 'ours']);
  });

  it('function form: user fn fires before ours', () => {
    const ourBlur = jest.fn();
    const userBlur = jest.fn();
    const userFn = jest.fn(() => ({ blur: userBlur })) as any;

    const merged = mergeListeners(userFn, { blur: ourBlur })({
      route: fakeRoute,
      navigation: fakeNavigation,
    });

    expect(userFn).toHaveBeenCalledWith({ route: fakeRoute, navigation: fakeNavigation });
    merged.blur!({} as any);
    expect(userBlur).toHaveBeenCalledTimes(1);
    expect(ourBlur).toHaveBeenCalledTimes(1);
  });

  it('preserves user-only events that we do not handle', () => {
    const userBeforeRemove = jest.fn();
    const ourFocus = jest.fn();

    const merged = mergeListeners({ beforeRemove: userBeforeRemove } as any, { focus: ourFocus })({
      route: fakeRoute,
      navigation: fakeNavigation,
    });

    expect(merged.beforeRemove).toBe(userBeforeRemove);
    expect(merged.focus).toBe(ourFocus);
  });
});

describe('buildScreenListeners', () => {
  let cleanup: () => void;

  beforeAll(() => {
    unstable_navigationEvents.enable();
  });

  beforeEach(() => {
    ({ cleanup } = recordEvents());
  });

  afterEach(() => {
    cleanup();
  });

  it('stack mode returns transitionStart and transitionEnd listeners', () => {
    const listeners = buildScreenListeners(
      'stack',
      noopRef,
      undefined
    )({
      route: fakeRoute,
      navigation: fakeNavigation,
    });

    expect(Object.keys(listeners).sort()).toEqual(['transitionEnd', 'transitionStart']);
  });

  it('tab mode returns focus and blur listeners', () => {
    const listeners = buildScreenListeners(
      'tab',
      noopRef,
      undefined
    )({
      route: fakeRoute,
      navigation: fakeNavigation,
    });

    expect(Object.keys(listeners).sort()).toEqual(['blur', 'focus']);
  });

  it('tab mode does not expose transition listeners', () => {
    const listeners = buildScreenListeners(
      'tab',
      noopRef,
      undefined
    )({
      route: fakeRoute,
      navigation: fakeNavigation,
    });

    expect(listeners.transitionStart).toBeUndefined();
    expect(listeners.transitionEnd).toBeUndefined();
  });

  it('merges user-supplied screenListeners (object form)', () => {
    const userTransitionStart = jest.fn();

    const listeners = buildScreenListeners('stack', noopRef, {
      transitionStart: userTransitionStart,
    } as any)({
      route: fakeRoute,
      navigation: fakeNavigation,
    });

    const arg = { data: { closing: false } };
    listeners.transitionStart!(arg as any);

    expect(userTransitionStart).toHaveBeenCalledTimes(1);
    expect(userTransitionStart).toHaveBeenCalledWith(arg);
  });

  it('merges user-supplied screenListeners (function form)', () => {
    const userTransitionEnd = jest.fn();

    const listeners = buildScreenListeners('stack', noopRef, (() => ({
      transitionEnd: userTransitionEnd,
    })) as any)({
      route: fakeRoute,
      navigation: fakeNavigation,
    });

    const arg = { data: { closing: true } };
    listeners.transitionEnd!(arg as any);

    expect(userTransitionEnd).toHaveBeenCalledTimes(1);
    expect(userTransitionEnd).toHaveBeenCalledWith(arg);
  });
});

describe('listener composition', () => {
  let cleanup: () => void;

  beforeAll(() => {
    unstable_navigationEvents.enable();
  });

  beforeEach(() => {
    ({ cleanup } = recordEvents());
  });

  afterEach(() => {
    cleanup();
  });

  it('does not throw when navigators mount and unmount', () => {
    const { unmount } = renderRouter({
      _layout: () => <Tabs />,
      home: () => <Text>Home</Text>,
    });

    expect(() => unmount()).not.toThrow();
  });
});

describe('appendRouteToFocusedState', () => {
  it('returns just the leaf when parent is undefined', () => {
    const composed = appendRouteToFocusedState(undefined, {
      key: 'a-key',
      name: 'a',
      params: undefined,
    } as any);

    expect(composed).toEqual({
      routes: [{ key: 'a-key', name: 'a', params: undefined, path: undefined }],
    });
  });

  it('appends the leaf to the innermost level of parent', () => {
    const parent = { routes: [{ key: 'root', name: 'root' }] } as any;

    const composed = appendRouteToFocusedState(parent, {
      key: 'a-key',
      name: 'a',
      params: undefined,
    } as any);

    expect(composed).toEqual({
      routes: [
        {
          key: 'root',
          name: 'root',
          state: {
            routes: [{ key: 'a-key', name: 'a', params: undefined, path: undefined }],
          },
        },
      ],
    });
  });

  it('expands params with {screen: c} into nested state', () => {
    const composed = appendRouteToFocusedState(undefined, {
      key: 'b-key',
      name: 'b',
      params: { screen: 'c' },
    } as any);

    expect(composed).toEqual({
      routes: [
        {
          key: 'b-key',
          name: 'b',
          params: undefined,
          path: undefined,
          state: {
            routes: [{ name: 'c', params: undefined, key: undefined, path: undefined }],
          },
        },
      ],
    });
  });

  it('recursively expands {screen: c, params: { screen: d }}', () => {
    const composed = appendRouteToFocusedState(undefined, {
      key: 'b-key',
      name: 'b',
      params: { screen: 'c', params: { screen: 'd' } },
    } as any);

    expect(composed).toEqual({
      routes: [
        {
          key: 'b-key',
          name: 'b',
          params: undefined,
          path: undefined,
          state: {
            routes: [
              {
                name: 'c',
                params: undefined,
                key: undefined,
                path: undefined,
                state: {
                  routes: [{ name: 'd', params: undefined, key: undefined, path: undefined }],
                },
              },
            ],
          },
        },
      ],
    });
  });

  it('strips screen/params keys but keeps other own params at each level', () => {
    const composed = appendRouteToFocusedState(undefined, {
      key: 'b-key',
      name: 'b',
      params: { screen: 'c', foo: 'bar', params: { baz: 'qux' } },
    } as any);

    expect(composed).toEqual({
      routes: [
        {
          key: 'b-key',
          name: 'b',
          params: { foo: 'bar' },
          path: undefined,
          state: {
            routes: [{ name: 'c', params: { baz: 'qux' }, key: undefined, path: undefined }],
          },
        },
      ],
    });
  });

  it('appends an expanded leaf to a parent with existing nesting', () => {
    const parent = {
      routes: [
        {
          key: 'root',
          name: 'root',
          state: { routes: [{ key: 'a-key', name: 'a' }] },
        },
      ],
    } as any;

    const composed = appendRouteToFocusedState(parent, {
      key: 'b-key',
      name: 'b',
      params: { screen: 'c', params: { screen: 'd', x: 'y' } },
    } as any);

    expect(composed).toEqual({
      routes: [
        {
          key: 'root',
          name: 'root',
          state: {
            routes: [
              {
                key: 'a-key',
                name: 'a',
                state: {
                  routes: [
                    {
                      key: 'b-key',
                      name: 'b',
                      params: undefined,
                      path: undefined,
                      state: {
                        routes: [
                          {
                            name: 'c',
                            params: { x: 'y' },
                            key: undefined,
                            path: undefined,
                            state: {
                              routes: [
                                {
                                  name: 'd',
                                  params: undefined,
                                  key: undefined,
                                  path: undefined,
                                },
                              ],
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    });
  });
});

describe('emit pathname for routes with screen params', () => {
  let events: RecordedEvent[];
  let cleanup: () => void;

  beforeAll(() => {
    unstable_navigationEvents.enable();
  });

  beforeEach(() => {
    ({ events, cleanup } = recordEvents());
  });

  afterEach(() => {
    cleanup();
  });

  it('reports nested pathname when route params have {screen: X}', () => {
    const parentRef = {
      current: { routes: [{ key: 'root', name: 'pathname-test-a' }] },
    } as any;

    const listeners = buildStackListeners(parentRef, {
      key: 'b-key',
      name: 'pathname-test-b',
      params: { screen: 'pathname-test-c' },
    } as any);

    listeners.transitionEnd({ data: { closing: false } } as any);

    expect(events).toHaveLength(1);
    expect(events[0]!.pathname).toBe('/pathname-test-a/pathname-test-b/pathname-test-c');
  });

  it('reports doubly-nested pathname for nested screen params', () => {
    const parentRef = {
      current: { routes: [{ key: 'root', name: 'deep-test-a' }] },
    } as any;

    const listeners = buildStackListeners(parentRef, {
      key: 'b-key',
      name: 'deep-test-b',
      params: { screen: 'deep-test-c', params: { screen: 'deep-test-d' } },
    } as any);

    listeners.transitionEnd({ data: { closing: false } } as any);

    expect(events).toHaveLength(1);
    expect(events[0]!.pathname).toBe('/deep-test-a/deep-test-b/deep-test-c/deep-test-d');
  });

  it('preserves params at the focused (deepest) level', () => {
    const parentRef = {
      current: { routes: [{ key: 'root', name: 'q-test-a' }] },
    } as any;

    const listeners = buildStackListeners(parentRef, {
      key: 'b-key',
      name: 'q-test-b',
      params: { screen: 'q-test-c', params: { foo: 'bar' } },
    } as any);

    listeners.transitionEnd({ data: { closing: false } } as any);

    expect(events).toHaveLength(1);
    expect(events[0]!.pathname).toBe('/q-test-a/q-test-b/q-test-c');
    expect(events[0]!.params).toEqual({ foo: 'bar' });
  });

  it('reports correct pathname with nested screen params and standard params on all levels', () => {
    const parentRef = {
      current: { routes: [{ key: 'root', name: 'multi-test-a' }] },
    } as any;

    const listeners = buildStackListeners(parentRef, {
      key: 'b-key',
      name: 'multi-test-b',
      params: {
        screen: 'multi-test-c',
        params: {
          screen: 'multi-test-d',
          params: { leafParam: 'leaf' },
        },
      },
    } as any);

    listeners.transitionEnd({ data: { closing: false } } as any);

    expect(events).toHaveLength(1);
    expect(events[0]!.pathname).toBe('/multi-test-a/multi-test-b/multi-test-c/multi-test-d');
    expect(events[0]!.params).toEqual({ leafParam: 'leaf' });
  });
});
