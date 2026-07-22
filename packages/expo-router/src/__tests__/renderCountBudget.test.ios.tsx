import { act, screen } from '@testing-library/react-native';
import { type ComponentType } from 'react';
import { Text } from 'react-native';

import { router } from '../exports';
import { Stack } from '../layouts/Stack';
import { Tabs } from '../layouts/Tabs';
import { renderRouter } from '../testing-library';

const TestTabs = Tabs as unknown as ComponentType;
const TestStack = Stack as unknown as ComponentType;

// Risk-3 render-count budget for the transitions flip: the plan's worst case (many tabs × deep
// stacks) — a navigation inside one tab's stack must NOT cascade re-renders across the other tabs'
// navigator bodies and screens. Post-flip the whole tree hangs off one root `useReducer`, so any
// commit re-renders the container; the budget below asserts that re-render does not propagate into
// the sibling tabs' subtrees.
//
// The bail-out is provided by two layers together: react-native-screens keeps inactive tab/stack
// subtrees detached or inactive, and the `SceneView` `React.memo` (keyed on `routeState` identity)
// stops an unchanged child navigator from re-rendering when the root tree changes identity. This
// test measures the observable end result (siblings do not re-render on the measured commit); it
// cannot isolate the memo's contribution from native screen detachment in this renderer, so treat it
// as a budget regression tripwire — a regression that made the root commit re-render every navigator
// body would trip it — not a memo-specific unit test. (The `SceneView` memo is exercised indirectly
// by the tab-switch bail-out assertions in `renderCount.test`.)
describe('render-count budget — 5 tabs x deep stacks', () => {
  it('navigating inside one tab does not re-render the other tabs’ navigators or screens', () => {
    const tabNames = ['a', 'b', 'c', 'd', 'e'];
    const stackLayoutRender: Record<string, jest.Mock> = {};
    const indexRender: Record<string, jest.Mock> = {};
    const detailRender: Record<string, jest.Mock> = {};
    for (const t of tabNames) {
      stackLayoutRender[t] = jest.fn();
      indexRender[t] = jest.fn();
      detailRender[t] = jest.fn();
    }

    // 5 tabs, each a nested stack with an index + a detail screen (a deep stack per tab).
    const routes: Record<string, any> = {
      _layout: () => <TestTabs />,
    };
    for (const t of tabNames) {
      routes[`${t}/_layout`] = function StackLayout() {
        stackLayoutRender[t]!();
        return <TestStack />;
      };
      routes[`${t}/index`] = function Index() {
        indexRender[t]!();
        return <Text testID={`${t}-index`}>{t} index</Text>;
      };
      routes[`${t}/detail`] = function Detail() {
        detailRender[t]!();
        return <Text testID={`${t}-detail`}>{t} detail</Text>;
      };
    }

    renderRouter(routes, { initialUrl: '/a' });

    expect(screen.getByTestId('a-index')).toBeVisible();

    // Visit every tab once so each tab's stack mounts at least once, then return to tab a for the
    // measured push.
    for (const t of tabNames.slice(1)) {
      act(() => router.push(`/${t}`));
    }
    act(() => router.push('/a'));

    // Guard against a vacuous pass: the sibling stacks actually mounted during the visits above, so
    // the post-push "not re-rendered" checks mean the subtree existed and then stayed put, not that
    // it never rendered at all.
    for (const t of ['b', 'c', 'd', 'e']) {
      expect(stackLayoutRender[t]!.mock.calls.length).toBeGreaterThan(0);
      expect(indexRender[t]!.mock.calls.length).toBeGreaterThan(0);
    }

    jest.clearAllMocks();

    // Push a detail screen inside tab a's stack — one commit on the root `useReducer`. Tab a's detail
    // screen mounts; the budget is that the OTHER four tabs' navigator bodies and screens do not
    // re-render off the back of this commit.
    act(() => router.push('/a/detail'));

    expect(screen.getByTestId('a-detail')).toBeVisible();

    // The touched tab's new detail screen mounts exactly once — a genuine render happened in this
    // subtree, so the navigation is not being globally bailed out.
    expect(detailRender.a!).toHaveBeenCalledTimes(1);

    // The other four tabs do not re-render off this commit — the budget holds.
    for (const t of ['b', 'c', 'd', 'e']) {
      expect(stackLayoutRender[t]!).not.toHaveBeenCalled();
      expect(indexRender[t]!).not.toHaveBeenCalled();
      expect(detailRender[t]!).not.toHaveBeenCalled();
    }
  });
});
