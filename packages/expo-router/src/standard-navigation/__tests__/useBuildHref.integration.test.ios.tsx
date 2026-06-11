import { Fragment } from 'react';
import { View } from 'react-native';
import { type NavigatorArgs } from 'standard-navigation';

import type { ParamListBase } from '../../react-navigation/core';
import {
  TabRouter,
  type TabNavigationState,
  type TabRouterOptions,
} from '../../react-navigation/routers';
import { renderRouter } from '../../testing-library';
import { unstable_createStandardRouterNavigator } from '../index';

// Integration: useBuildHref through the real useStateForPath → getCachedRouteInfo pipeline, resolving
// hrefs for a real navigator's routes via renderRouter. Isolated nesting logic is unit-tested in
// useBuildHref.test.ios.tsx.
const contentSpy = jest.fn();

function NavigatorContent(args: NavigatorArgs<Record<string, never>, Record<string, never>>) {
  contentSpy(args);
  return (
    <>
      {args.state.routes.map((r) => (
        <Fragment key={r.key}>{args.descriptors[r.key]!.render()}</Fragment>
      ))}
    </>
  );
}

const StandardTabs = unstable_createStandardRouterNavigator<
  Record<string, never>,
  TabNavigationState<ParamListBase>,
  Record<string, never>,
  object,
  TabRouterOptions
>(NavigatorContent, TabRouter, { useOnlyUserDefinedScreens: true });

describe('useBuildHref (integration)', () => {
  it('resolves real hrefs (index → /, group segment stripped) for navigator routes', () => {
    renderRouter({
      _layout: () => (
        <StandardTabs>
          <StandardTabs.Screen name="index" />
          <StandardTabs.Screen name="(group)/feed" />
        </StandardTabs>
      ),
      index: () => <View testID="index" />,
      '(group)/feed': () => <View testID="feed" />,
    });
    const lastArgs = () =>
      contentSpy.mock.calls.at(-1)![0] as NavigatorArgs<
        Record<string, never>,
        Record<string, never>
      >;

    expect(
      lastArgs()
        .state.routes.map((r) => r.href)
        .sort()
    ).toEqual(['/', '/feed']);
  });
});
