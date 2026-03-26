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

// import { TabView } from 'react-native-tab-view';
let TabView: any;
try {
  const tabViewModule = require('react-native-tab-view');
  TabView = tabViewModule.TabView;
} catch (e) {
  throw new Error(
    "Install the 'react-native-tab-view' package and its peer dependencies to use the MaterialTopTabs."
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

  const renderTabBar: React.ComponentProps<any>['renderTabBar'] = ({
    /* eslint-disable @typescript-eslint/no-unused-vars */
    navigationState,
    options,
    /* eslint-enable @typescript-eslint/no-unused-vars */
    ...rest
  }: any) => {
    return tabBar({
      ...rest,
      state: state,
      navigation: navigation,
      descriptors: descriptors,
    });
  };

  const focusedOptions = descriptors[state.routes[state.index].key].options;

  return (
    <TabView<Route<string>>
      {...rest}
      onIndexChange={(index: number) => {
        const route = state.routes[index];

        navigation.dispatch({
          ...CommonActions.navigate(route),
          target: state.key,
        });
      }}
      renderScene={({ route, position }: any) => (
        <TabAnimationContext.Provider value={{ position }}>
          {descriptors[route.key].render()}
        </TabAnimationContext.Provider>
      )}
      navigationState={state}
      renderTabBar={renderTabBar}
      renderLazyPlaceholder={({ route }: any) =>
        descriptors[route.key].options.lazyPlaceholder?.() ?? null
      }
      lazy={({ route }: any) =>
        descriptors[route.key].options.lazy === true &&
        !state.preloadedRouteKeys.includes(route.key)
      }
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
