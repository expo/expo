import type { TabViewProps } from 'react-native-tab-view';

import { type Route, useLocale, useTheme } from '../../native';
import type {
  MaterialTopTabBarProps,
  MaterialTopTabDescriptorMap,
  MaterialTopTabEmitter,
  MaterialTopTabNavigationConfig,
  MaterialTopTabViewState,
} from '../types';
import { TabAnimationContext } from '../utils/TabAnimationContext';
import { MaterialTopTabBar } from './MaterialTopTabBar';

// Use dynamic import to avoid having direct dependency on react-native-tab-view.
// import { TabView } from 'react-native-tab-view';
let TabView: typeof import('react-native-tab-view').TabView;
try {
  const tabViewModule = require('react-native-tab-view');
  TabView = tabViewModule.TabView;
} catch (e) {
  throw new Error(
    "Install the 'react-native-tab-view' package and its peer dependencies to use the Expo Router's TopTabs."
  );
}

type Props = MaterialTopTabNavigationConfig & {
  state: MaterialTopTabViewState;
  descriptors: MaterialTopTabDescriptorMap;
  emitter: MaterialTopTabEmitter;
  navigateToTab: (routeKey: string) => void;
  preloadedRouteKeys: string[];
};

const renderTabBarDefault = (props: MaterialTopTabBarProps) => <MaterialTopTabBar {...props} />;

export function MaterialTopTabView({
  tabBar = renderTabBarDefault,
  state,
  descriptors,
  emitter,
  navigateToTab,
  preloadedRouteKeys,
  ...rest
}: Props) {
  const { colors } = useTheme();
  const { direction } = useLocale();

  const renderTabBar: NonNullable<TabViewProps<Route<string>>['renderTabBar']> = ({
    /* eslint-disable @typescript-eslint/no-unused-vars */
    navigationState,
    options,
    /* eslint-enable @typescript-eslint/no-unused-vars */
    ...rest
  }) => {
    const tabBarProps = {
      ...rest,
      state,
      descriptors,
      emitter,
      navigateToTab,
    } satisfies MaterialTopTabBarProps;

    return tabBar(tabBarProps);
  };

  const focusedOptions = descriptors[state.routes[state.index]!.key]!.options;

  return (
    <TabView<Route<string>>
      {...rest}
      onIndexChange={(index: number) => navigateToTab(state.routes[index]!.key)}
      renderScene={({ route, position }) => (
        <TabAnimationContext.Provider value={{ position }}>
          {descriptors[route.key]!.render()}
        </TabAnimationContext.Provider>
      )}
      navigationState={state}
      renderTabBar={renderTabBar}
      renderLazyPlaceholder={({ route }) =>
        descriptors[route.key]!.options.lazyPlaceholder?.() ?? null
      }
      lazy={({ route }) =>
        descriptors[route.key]!.options.lazy === true && !preloadedRouteKeys.includes(route.key)
      }
      lazyPreloadDistance={focusedOptions.lazyPreloadDistance}
      swipeEnabled={focusedOptions.swipeEnabled}
      animationEnabled={focusedOptions.animationEnabled}
      onSwipeStart={() => emitter.emit({ type: 'swipeStart' })}
      onSwipeEnd={() => emitter.emit({ type: 'swipeEnd' })}
      direction={direction}
      options={Object.fromEntries(
        state.routes.map((route) => {
          const options = descriptors[route.key]?.options;

          return [
            route.key,
            {
              sceneStyle: [{ backgroundColor: colors.background }, options?.sceneStyle],
            },
          ];
        })
      )}
    />
  );
}
