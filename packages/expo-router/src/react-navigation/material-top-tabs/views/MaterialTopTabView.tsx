import { useMemo } from 'react';

import { useStableTabOrder } from '../../core/useStableTabOrder';
import {
  CommonActions,
  type ParamListBase,
  type Route,
  type TabNavigationState,
  useLocale,
  useTheme,
} from '../../native';
import type {
  MaterialTopTabBarProps,
  MaterialTopTabDescriptorMap,
  MaterialTopTabNavigationConfig,
  MaterialTopTabNavigationHelpers,
} from '../types';
import { TabAnimationContext } from '../utils/TabAnimationContext';
import { MaterialTopTabBar } from './MaterialTopTabBar';

// Use dynamic import to avoid having direct dependency on react-native-tab-view.
// import { TabView } from 'react-native-tab-view';
let TabView: any;
try {
  const tabViewModule = require('react-native-tab-view');
  TabView = tabViewModule.TabView;
} catch (e) {
  throw new Error(
    "Install the 'react-native-tab-view' package and its peer dependencies to use the Expo Router's TopTabs."
  );
}

type Props = MaterialTopTabNavigationConfig & {
  state: TabNavigationState<ParamListBase>;
  navigation: MaterialTopTabNavigationHelpers;
  descriptors: MaterialTopTabDescriptorMap;
};

const renderTabBarDefault = (props: MaterialTopTabBarProps) => <MaterialTopTabBar {...props} />;

export function MaterialTopTabView({
  tabBar = renderTabBarDefault,
  state,
  navigation,
  descriptors,
  ...rest
}: Props) {
  const { colors } = useTheme();
  const { direction } = useLocale();

  // `state.routes` is ordered by the navigator's back stack; render the strip and
  // pager in stable declaration order and detect focus by key.
  const orderedRoutes = useStableTabOrder(state.routeNames, state.routes);
  const focusedKey = state.routes[state.index]!.key;

  const focusedIndex = useMemo(() => {
    const index = orderedRoutes.findIndex((route) => route.key === focusedKey);
    if (index === -1) {
      console.warn(
        `Could not find the focused route (key "${focusedKey}") in the ordered tab routes. Falling back to the first tab.`
      );
      return 0;
    }
    return index;
  }, [orderedRoutes, focusedKey]);
  const orderedState = useMemo(
    () => ({
      ...state,
      routes: orderedRoutes,
      index: focusedIndex,
    }),
    [state, orderedRoutes, focusedIndex]
  );

  const renderTabBar: React.ComponentProps<any>['renderTabBar'] = ({
    /* eslint-disable @typescript-eslint/no-unused-vars */
    navigationState,
    options,
    /* eslint-enable @typescript-eslint/no-unused-vars */
    ...rest
  }: any) => {
    return tabBar({
      ...rest,
      state: orderedState,
      navigation,
      descriptors,
    });
  };

  const focusedOptions = descriptors[focusedKey]!.options;

  return (
    <TabView<Route<string>>
      {...rest}
      onIndexChange={(index: number) => {
        navigation.dispatch({
          ...CommonActions.navigate(orderedRoutes[index]!),
          target: state.key,
        });
      }}
      renderScene={({ route, position }: any) => (
        <TabAnimationContext.Provider value={{ position }}>
          {descriptors[route.key]!.render()}
        </TabAnimationContext.Provider>
      )}
      navigationState={orderedState}
      renderTabBar={renderTabBar}
      renderLazyPlaceholder={({ route }: any) =>
        descriptors[route.key]!.options.lazyPlaceholder?.() ?? null
      }
      // Material top tabs are fully eager (all routes are preloaded), so never lazy-defer a screen.
      lazy={false}
      lazyPreloadDistance={focusedOptions.lazyPreloadDistance}
      swipeEnabled={focusedOptions.swipeEnabled}
      animationEnabled={focusedOptions.animationEnabled}
      onSwipeStart={() => navigation.emit({ type: 'swipeStart' })}
      onSwipeEnd={() => navigation.emit({ type: 'swipeEnd' })}
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
