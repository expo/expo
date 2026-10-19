import { act } from '@testing-library/react-native';
import { Suspense, useEffect } from 'react';
import { Text } from 'react-native';

import { disableImplicitModalWarning } from '../exports';
import {
  registerNativeStack,
  resetImplicitModalWarningForTests,
  warnIfAffectedCardRouteShowsAsModal,
  type NativeStackRegistration,
} from '../global-state/implicitModalWarning';
import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import Tabs from '../layouts/Tabs';
import { Link } from '../link';
import type { NavigationState } from '../react-navigation/routers';
import { renderRouter } from '../testing-library';
import { useNavigation } from '../useNavigation';

afterEach(() => {
  resetImplicitModalWarningForTests();
  jest.restoreAllMocks();
});

test('warns once when Link renders or router.push targets a card after a modal', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  await renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Screen name="sheet" options={{ presentation: 'formSheet' }} />
        <Stack.Screen name="card-target" options={{ presentation: 'card' }} />
        <Stack.Screen
          name="dynamic-card-target"
          options={({ route }) => ({
            presentation: Object.hasOwn(route.params ?? {}, 'card') ? 'card' : undefined,
          })}
        />
      </Stack>
    ),
    index: () => <Text>Index</Text>,
    sheet: () => (
      <>
        <Link href="/link-target">Implicit modal</Link>
        <Link href="/card-target">Card</Link>
        <Link href={{ pathname: '/dynamic-card-target', params: { card: 'true' } }}>
          Dynamic card
        </Link>
      </>
    ),
    'link-target': () => <Text>Link target</Text>,
    'push-target': () => <Text>Push target</Text>,
    'card-target': () => <Text>Card target</Text>,
    'dynamic-card-target': () => <Text>Dynamic card target</Text>,
  });

  await act(() => router.push('/sheet'));
  expect(warn.mock.calls).toEqual([
    [
      expect.stringMatching(
        /route "link-target".*behavior may change.*options=\{\(\{ route \}\) => \.\.\.\}/
      ),
    ],
  ]);

  await act(() => router.setParams({ rerender: 'true' }));
  expect(warn).toHaveBeenCalledTimes(1);

  await act(() => router.push('/push-target'));
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('push-target'));
});

test('warns for a Link on the first render after the stack registers', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  await renderRouter(
    {
      _layout: () => (
        <Stack>
          <Stack.Screen name="sheet" options={{ presentation: 'formSheet' }} />
        </Stack>
      ),
      index: () => <Text>Index</Text>,
      sheet: () => <Link href="/first-mount-target">Target</Link>,
      'first-mount-target': () => <Text>Target</Text>,
    },
    { initialUrl: '/sheet' }
  );

  expect(warn).toHaveBeenCalledWith(expect.stringContaining('first-mount-target'));
});

test('uses destination params when a push reuses a preloaded route', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  await renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Screen name="sheet" options={{ presentation: 'formSheet' }} />
        <Stack.Screen
          name="preloaded-target"
          options={({ route }) => ({
            presentation:
              route.params && 'card' in route.params && route.params.card === 'true'
                ? 'card'
                : undefined,
          })}
        />
      </Stack>
    ),
    index: () => <Text>Index</Text>,
    sheet: () => <Text>Sheet</Text>,
    'preloaded-target': () => <Text>Target</Text>,
  });

  await act(() => router.push('/sheet'));
  await act(() => router.prefetch({ pathname: '/preloaded-target', params: { card: 'true' } }));
  await act(() => router.push({ pathname: '/preloaded-target', params: { card: 'false' } }));

  expect(warn).toHaveBeenCalledWith(expect.stringContaining('preloaded-target'));
});

test('inspects a destination stack when navigating across tabs', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  await renderRouter(
    {
      _layout: () => (
        <Tabs>
          <Tabs.Screen name="index" />
          <Tabs.Screen name="feed" />
        </Tabs>
      ),
      index: () => <Text>Index</Text>,
      'feed/_layout': () => (
        <Stack>
          <Stack.Screen name="sheet" options={{ presentation: 'formSheet' }} />
        </Stack>
      ),
      'feed/index': () => <Text>Feed</Text>,
      'feed/sheet': () => <Text>Sheet</Text>,
      'feed/cross-tab-target': () => <Text>Target</Text>,
    },
    { initialUrl: '/feed' }
  );

  await act(() => router.push('/feed/sheet'));
  await act(() => router.navigate('/'));
  await act(() => router.push('/feed/cross-tab-target'));

  expect(warn).toHaveBeenCalledWith(expect.stringContaining('cross-tab-target'));
});

test('accounts for earlier pushes in the same batch', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  await renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Screen name="sheet" options={{ presentation: 'formSheet' }} />
      </Stack>
    ),
    index: () => <Text>Index</Text>,
    sheet: () => <Text>Sheet</Text>,
    'batched-target': () => <Text>Target</Text>,
  });

  await act(() => {
    router.push('/sheet');
    router.push('/batched-target');
  });

  expect(warn).toHaveBeenCalledWith(expect.stringContaining('batched-target'));
});

test('accounts for an earlier navigate in the same batch', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  await renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Screen name="sheet" options={{ presentation: 'formSheet' }} />
      </Stack>
    ),
    index: () => <Text>Index</Text>,
    sheet: () => <Text>Sheet</Text>,
    'navigate-batched-target': () => <Text>Target</Text>,
  });

  await act(() => {
    router.navigate('/sheet');
    router.push('/navigate-batched-target');
  });

  expect(warn).toHaveBeenCalledWith(expect.stringContaining('navigate-batched-target'));
});

test('accounts for an earlier back in the same batch', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  await renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Screen name="sheet" options={{ presentation: 'formSheet' }} />
      </Stack>
    ),
    index: () => <Text>Index</Text>,
    sheet: () => <Text>Sheet</Text>,
    'back-batched-target': () => <Text>Target</Text>,
  });

  await act(() => router.push('/sheet'));
  await act(() => {
    router.back();
    router.push('/back-batched-target');
  });

  expect(warn).not.toHaveBeenCalled();
});

test('warns when a later queued action unmounts the destination stack', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  await renderRouter(
    {
      _layout: () => <Stack />,
      index: () => <Text>Index</Text>,
      'nested/_layout': () => (
        <Stack>
          <Stack.Screen name="sheet" options={{ presentation: 'formSheet' }} />
        </Stack>
      ),
      'nested/index': () => <Text>Nested index</Text>,
      'nested/sheet': () => <Text>Sheet</Text>,
      'nested/unmounted-target': () => <Text>Target</Text>,
    },
    { initialUrl: '/nested/sheet' }
  );

  await act(() => {
    router.push('/nested/unmounted-target');
    router.dismissTo('/');
  });

  expect(warn).toHaveBeenCalledWith(expect.stringContaining('unmounted-target'));
});

test('preserves removed modal overrides until a queued warning is reported', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  function DynamicSheet() {
    const navigation = useNavigation();
    useEffect(() => navigation.setOptions({ presentation: 'formSheet' }), [navigation]);
    return <Text>Sheet</Text>;
  }

  await renderRouter({
    _layout: () => <Stack />,
    index: () => <Text>Index</Text>,
    'removed-dynamic-sheet': DynamicSheet,
    'removed-options-target': () => <Text>Target</Text>,
  });

  await act(() => router.push('/removed-dynamic-sheet'));
  await act(() => {
    router.push('/removed-options-target');
    router.dismissAll();
  });

  expect(warn).toHaveBeenCalledWith(expect.stringContaining('removed-options-target'));
});

test('preserves a removed preloaded target override until a queued warning is reported', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  function CardTarget() {
    const navigation = useNavigation();
    useEffect(() => navigation.setOptions({ presentation: 'card' }), [navigation]);
    return <Text>Target</Text>;
  }

  await renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Screen name="removed-options-sheet" options={{ presentation: 'formSheet' }} />
      </Stack>
    ),
    index: () => <Text>Index</Text>,
    'removed-options-sheet': () => <Text>Sheet</Text>,
    'removed-card-target': CardTarget,
  });

  await act(() => router.push('/removed-options-sheet'));
  await act(() => router.prefetch('/removed-card-target'));
  await act(() => {
    router.push('/removed-card-target');
    router.dismissAll();
  });

  expect(warn).not.toHaveBeenCalled();
});

test('preserves overrides from different retained stack snapshots', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const state: NavigationState = {
    stale: false,
    type: 'stack',
    key: 'snapshot-stack',
    routeKeySeq: 0,
    index: 1,
    routeNames: ['dynamic-sheet', 'snapshot-target'],
    routes: [
      { key: 'dynamic-sheet-key', name: 'dynamic-sheet' },
      { key: 'snapshot-target-key', name: 'snapshot-target' },
    ],
  };
  const modalRegistration: NativeStackRegistration = {
    stateKey: state.key,
    routeKeys: ['dynamic-sheet-key'],
    descriptors: {
      'dynamic-sheet-key': {
        route: state.routes[0]!,
        options: { presentation: 'formSheet' },
      },
    },
    describe: (route) => ({ route, options: {} }),
    getOptionsOverrides: (routeKey) =>
      routeKey === 'dynamic-sheet-key' ? { presentation: 'formSheet' } : undefined,
  };
  const targetRegistration: NativeStackRegistration = {
    stateKey: state.key,
    routeKeys: ['snapshot-target-key'],
    descriptors: {
      'snapshot-target-key': { route: state.routes[1]!, options: {} },
    },
    describe: (route) => ({ route, options: {} }),
    getOptionsOverrides: () => undefined,
  };
  const unregisterModal = registerNativeStack(modalRegistration);
  const unregisterTarget = registerNativeStack(targetRegistration);

  try {
    warnIfAffectedCardRouteShowsAsModal(state, 'snapshot-target-key', {
      registry: new Map(),
    });

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('snapshot-target'));
  } finally {
    unregisterTarget();
    unregisterModal();
  }
});

test('preserves setOptions presentation when destination params change', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  function CardTarget() {
    const navigation = useNavigation();
    useEffect(() => navigation.setOptions({ presentation: 'card' }), [navigation]);
    return <Text>Target</Text>;
  }

  await renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Screen name="sheet" options={{ presentation: 'formSheet' }} />
      </Stack>
    ),
    index: () => <Text>Index</Text>,
    sheet: () => <Text>Sheet</Text>,
    'set-options-target': CardTarget,
  });

  await act(() => router.push('/sheet'));
  await act(() => router.prefetch({ pathname: '/set-options-target', params: { version: 'one' } }));
  await act(() => router.push({ pathname: '/set-options-target', params: { version: 'two' } }));

  expect(warn).not.toHaveBeenCalled();
});

test('preserves setOptions presentation when it matches the configured presentation', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  function CardTarget() {
    const navigation = useNavigation();
    useEffect(() => navigation.setOptions({ presentation: 'card' }), [navigation]);
    return <Text>Target</Text>;
  }

  await renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Screen name="sheet" options={{ presentation: 'formSheet' }} />
        <Stack.Screen
          name="matching-set-options-target"
          options={({ route }) => ({
            presentation: Object.hasOwn(route.params ?? {}, 'configured') ? 'card' : undefined,
          })}
        />
      </Stack>
    ),
    index: () => <Text>Index</Text>,
    sheet: () => <Text>Sheet</Text>,
    'matching-set-options-target': CardTarget,
  });

  await act(() => router.push('/sheet'));
  await act(() =>
    router.prefetch({
      pathname: '/matching-set-options-target',
      params: { configured: 'card' },
    })
  );
  await act(() => router.push('/matching-set-options-target'));

  expect(warn).not.toHaveBeenCalled();
});

test('uses projected params when evaluating a preceding route', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  await renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Screen
          name="parameterized-sheet"
          options={({ route }) => ({
            presentation: Object.hasOwn(route.params ?? {}, 'sheet') ? 'formSheet' : 'card',
          })}
        />
      </Stack>
    ),
    index: () => <Text>Index</Text>,
    'parameterized-sheet': () => <Text>Sheet</Text>,
    'projected-params-target': () => <Text>Target</Text>,
  });

  await act(() =>
    router.prefetch({
      pathname: '/parameterized-sheet',
      params: { card: 'true' },
    })
  );
  await act(() => {
    router.push({
      pathname: '/parameterized-sheet',
      params: { sheet: 'true' },
    });
    router.push('/projected-params-target');
  });

  expect(warn).toHaveBeenCalledWith(expect.stringContaining('projected-params-target'));
});

test.each(['..', '../'])('does not warn for a %s back Link', async (href) => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  await renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Screen name="sheet" options={{ presentation: 'formSheet' }} />
      </Stack>
    ),
    index: () => <Text>Index</Text>,
    sheet: () => <Link href={href}>Back</Link>,
  });

  await act(() => router.push('/sheet'));

  expect(warn).not.toHaveBeenCalled();
});

test('does not warn for a Link in a render that never commits', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const pending = new Promise(() => {});

  function SuspendForever(): never {
    throw pending;
  }

  await renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Screen name="sheet" options={{ presentation: 'formSheet' }} />
      </Stack>
    ),
    index: () => <Text>Index</Text>,
    sheet: () => (
      <Suspense fallback={<Text>Loading</Text>}>
        <Link href="/abandoned-target">Target</Link>
        <SuspendForever />
      </Suspense>
    ),
    'abandoned-target': () => <Text>Target</Text>,
  });

  await act(() => router.push('/sheet'));

  expect(warn).not.toHaveBeenCalled();
});

test('deduplicates a queued push warning with a Link in a newly mounted stack', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  await renderRouter({
    _layout: () => <Stack />,
    index: () => <Text>Index</Text>,
    'anchored/_layout': {
      unstable_settings: { anchor: 'sheet' },
      default: () => (
        <Stack>
          <Stack.Screen name="sheet" options={{ presentation: 'formSheet' }} />
        </Stack>
      ),
    },
    'anchored/sheet': () => <Text>Sheet</Text>,
    'anchored/deduplicated-target': () => (
      <Link push href="/anchored/deduplicated-target">
        Target
      </Link>
    ),
  });

  await act(() => router.push('/anchored/deduplicated-target', { withAnchor: true }));

  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('deduplicated-target'));
});

test('warns separately for target routes in expanded layout groups', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  await renderRouter({
    _layout: () => <Stack />,
    index: () => <Text>Index</Text>,
    '(a,b)/_layout': () => (
      <Stack>
        <Stack.Screen name="sheet" options={{ presentation: 'formSheet' }} />
      </Stack>
    ),
    '(a)/sheet': () => <Text>A sheet</Text>,
    '(a)/group-target': () => <Text>A target</Text>,
    '(b)/sheet': () => <Text>B sheet</Text>,
    '(b)/group-target': () => <Text>B target</Text>,
  });

  await act(() => router.push('/(a)/sheet'));
  await act(() => router.push('/(a)/group-target'));
  await act(() => router.dismissTo('/'));
  await act(() => router.push('/(b)/sheet'));
  await act(() => router.push('/(b)/group-target'));

  const targetWarnings = warn.mock.calls.filter(([message]) =>
    String(message).includes('group-target')
  );
  expect(targetWarnings).toHaveLength(2);
});

test('can disable implicit modal warnings globally', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  await renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Screen name="sheet" options={{ presentation: 'formSheet' }} />
      </Stack>
    ),
    index: () => <Text>Index</Text>,
    sheet: () => <Text>Sheet</Text>,
    'disabled-target': () => <Text>Disabled target</Text>,
  });

  await act(() => router.push('/sheet'));

  disableImplicitModalWarning();
  await act(() => router.push('/disabled-target'));
  expect(warn).not.toHaveBeenCalled();
});
