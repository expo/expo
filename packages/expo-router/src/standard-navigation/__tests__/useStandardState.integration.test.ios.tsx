import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import Stack from '../../layouts/StackClient';
import { type NavigationState } from '../../react-navigation/core';
import {
  NavigationFocusedRouteStateContext,
  type FocusedRouteState,
} from '../../react-navigation/core/NavigationFocusedRouteStateContext';
import { renderRouter } from '../../testing-library';
import { useStandardState } from '../useStandardState';

// Integration: exercises useStandardState together with the real useBuildHref → useStateForPath →
// getCachedRouteInfo pipeline, asserting the actual resolved href strings. The isolated mapping and
// memo logic is covered by the unit test in useStandardState.test.ios.tsx.

// useStandardState only reads `index` and `routes` off the builder state, so a minimal
// NavigationState-shaped object is enough to exercise it.
function makeBuilderState(
  routes: { key: string; name: string; params?: object }[],
  index = 0
): NavigationState {
  return {
    key: 'builder',
    index,
    routeNames: routes.map((r) => r.name),
    routes,
    stale: false,
    preloadedRouteKeys: [],
  } as unknown as NavigationState;
}

// A focused-route state as `useStateForPath()` would return it: rooted at __root with a single
// nested parent segment whose name we vary to change the resolved path.
function makeCurrentState(parent: string): FocusedRouteState {
  return {
    routes: [{ name: '__root', state: { routes: [{ name: parent }] } }],
  };
}

function HrefProbe({ builderState }: { builderState: NavigationState }) {
  const state = useStandardState(builderState);
  return <Text testID="hrefs">{state.routes.map((r) => r.href).join('|')}</Text>;
}

function renderProbe(currentState: FocusedRouteState | undefined, builderState: NavigationState) {
  return render(
    <NavigationFocusedRouteStateContext.Provider value={currentState}>
      <HrefProbe builderState={builderState} />
    </NavigationFocusedRouteStateContext.Provider>
  );
}

describe('useStandardState (integration with useBuildHref)', () => {
  it('resolves a real href per route from the focused-route state', () => {
    const builderState = makeBuilderState(
      [
        { key: 'feed-1', name: 'feed' },
        { key: 'profile-1', name: 'profile' },
      ],
      1
    );
    renderProbe(makeCurrentState('group'), builderState);

    expect(screen.getByTestId('hrefs')).toHaveTextContent('/group/feed|/group/profile');
  });

  it('handles an empty route list', () => {
    const builderState = makeBuilderState([], 0);
    renderProbe(makeCurrentState('group'), builderState);

    expect(screen.getByTestId('hrefs')).toHaveTextContent('');
  });

  // Regression: the href embeds the parent focused path (via useBuildHref → useStateForPath).
  // If the memo only depends on [builderState], a parent-path change with a stable builderState
  // reference leaves stale hrefs. This reproduces a parent re-parenting the navigator.
  it('recomputes hrefs when the parent focused path changes even if builderState is stable', () => {
    const builderState = makeBuilderState([{ key: 'feed-1', name: 'feed' }], 0);

    const { rerender } = renderProbe(makeCurrentState('acme'), builderState);
    expect(screen.getByTestId('hrefs')).toHaveTextContent('/acme/feed');

    // Same builderState reference, different parent focused path.
    rerender(
      <NavigationFocusedRouteStateContext.Provider value={makeCurrentState('globex')}>
        <HrefProbe builderState={builderState} />
      </NavigationFocusedRouteStateContext.Provider>
    );
    expect(screen.getByTestId('hrefs')).toHaveTextContent('/globex/feed');
  });

  it('does not recompute when neither builderState nor the parent path change', () => {
    const builderState = makeBuilderState([{ key: 'feed-1', name: 'feed' }], 0);
    const currentState = makeCurrentState('acme');

    const { rerender } = renderProbe(currentState, builderState);
    const first = screen.getByTestId('hrefs').props.children;

    rerender(
      <NavigationFocusedRouteStateContext.Provider value={currentState}>
        <HrefProbe builderState={builderState} />
      </NavigationFocusedRouteStateContext.Provider>
    );
    expect(screen.getByTestId('hrefs').props.children).toBe(first);
  });
});

// Calls useStandardState directly from a real page rendered under a normal Stack navigator, so the
// hrefs are resolved against the actual current route via the real useStateForPath context.
describe('useStandardState (integration via renderRouter)', () => {
  function Probe() {
    const state = useStandardState(
      makeBuilderState(
        [
          { key: 'feed-1', name: 'feed' },
          { key: 'profile-1', name: 'profile' },
        ],
        1
      )
    );
    return (
      <Text testID="out">
        {JSON.stringify({ index: state.index, hrefs: state.routes.map((r) => r.href) })}
      </Text>
    );
  }

  it('maps a builder state to hrefs relative to the current page', () => {
    renderRouter(
      {
        _layout: () => <Stack />,
        home: Probe,
      },
      { initialUrl: '/home' }
    );

    expect(JSON.parse(screen.getByTestId('out').props.children)).toEqual({
      index: 1,
      hrefs: ['/home/feed', '/home/profile'],
    });
  });
});
