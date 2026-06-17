import { act } from '@testing-library/react-native';
import * as React from 'react';
import { Text } from 'react-native';

import { router } from '../../../imperative-api';
import { NativeTabs } from '../../../native-tabs/NativeTabs';
import { NativeTabsView as _NativeTabsView } from '../../../native-tabs/NativeTabsView';
import { renderRouter, screen } from '../../../testing-library';
import { __resetBehaviorMapForTests } from '../../behaviorMap';
import { __resetNewStateModelForTests, enableNewStateModel } from '../../enable';
import { getNavSnapshot } from '../../store';

// R-Phase D — NativeTabs from the new tree (Decisions R-2/P-10/R-12). The view is mocked to render
// each tab's content (so mount≠promotion is observable) and to capture props (onTabChange/focusedIndex).

jest.mock('../../../native-tabs/NativeTabsView', () => {
  const r = require('react') as typeof import('react');
  return {
    NativeTabsView: jest.fn(
      (props: { tabs: { routeKey: string; contentRenderer: () => React.ReactNode }[] }) =>
        props.tabs.map((tab) =>
          r.createElement(r.Fragment, { key: tab.routeKey }, tab.contentRenderer())
        )
    ),
  };
});

const NativeTabsView = _NativeTabsView as jest.MockedFunction<typeof _NativeTabsView>;
const lastProps = () => NativeTabsView.mock.calls.at(-1)![0];

beforeEach(() => enableNewStateModel());
afterEach(() => {
  __resetNewStateModelForTests();
  __resetBehaviorMapForTests();
  NativeTabsView.mockClear();
});

const App = {
  _layout: () => (
    <NativeTabs>
      <NativeTabs.Trigger name="home" />
      <NativeTabs.Trigger name="settings" />
    </NativeTabs>
  ),
  home: () => <Text>HomeScreen</Text>,
  settings: () => <Text>SettingsScreen</Text>,
};

it('mounts every declared tab (mount ≠ promotion), with only the matched tab promoted', () => {
  renderRouter(App, { initialUrl: '/home' });
  expect(screen.getByText('HomeScreen')).toBeVisible();
  expect(screen.getByText('SettingsScreen')).toBeVisible(); // mounted though not promoted
  expect(getNavSnapshot()!.root.routes.map((r) => r.name)).toEqual(['home']);
  expect(lastProps().focusedIndex).toBe(0);
});

it('navigating to another tab promotes + focuses it (set index, no route removed)', () => {
  renderRouter(App, { initialUrl: '/home' });
  act(() => router.navigate('/settings'));
  const root = getNavSnapshot()!.root;
  expect(root.routes.map((r) => r.name)).toEqual(['home', 'settings']);
  expect(root.index).toBe(1);
  expect(lastProps().focusedIndex).toBe(1);
});

it('switching back to an already-promoted tab is a set-index — no duplicate, nothing removed', () => {
  renderRouter(App, { initialUrl: '/home' });
  act(() => router.navigate('/settings'));
  act(() => router.navigate('/home'));
  const root = getNavSnapshot()!.root;
  expect(root.routes.map((r) => r.name)).toEqual(['home', 'settings']); // both retained
  expect(root.index).toBe(0); // home refocused
});

it('a native tab tap (onTabChange isNativeAction) promotes + focuses the tab', () => {
  renderRouter(App, { initialUrl: '/home' });
  act(() =>
    lastProps().onTabChange({ selectedKey: 'settings#tab', provenance: 1, isNativeAction: true })
  );
  expect(getNavSnapshot()!.root.routes.map((r) => r.name)).toEqual(['home', 'settings']);
  expect(getNavSnapshot()!.root.index).toBe(1);
});

it('a prevented tap (disabled tab) does NOT navigate', () => {
  renderRouter(App, { initialUrl: '/home' });
  act(() =>
    lastProps().onTabChange({
      selectedKey: 'settings#tab',
      provenance: 1,
      isNativeAction: true,
      isPrevented: true,
    })
  );
  expect(getNavSnapshot()!.root.routes.map((r) => r.name)).toEqual(['home']); // unchanged
});

describe('flag off', () => {
  beforeEach(() => __resetNewStateModelForTests());
  it('renders the legacy NativeTabs (new model not mounted)', () => {
    renderRouter(App, { initialUrl: '/home' });
    expect(getNavSnapshot()).toBeNull(); // new store never mounted
    expect(screen.getByText('HomeScreen')).toBeVisible();
  });
});
