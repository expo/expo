import { CommonActions, useLocale, useTheme, } from '../../native';
import { MaterialTopTabBar } from './MaterialTopTabBar';
import { TabAnimationContext } from '../utils/TabAnimationContext';
// Use dynamic import to avoid having direct dependency on react-native-tab-view.
// import { TabView } from 'react-native-tab-view';
let TabView;
try {
    const tabViewModule = require('react-native-tab-view');
    TabView = tabViewModule.TabView;
}
catch (e) {
    throw new Error("Install the 'react-native-tab-view' package and its peer dependencies to use the Expo Router's TopTabs.");
}
const renderTabBarDefault = (props) => <MaterialTopTabBar {...props}/>;
export function MaterialTopTabView({ tabBar = renderTabBarDefault, state, navigation, descriptors, ...rest }) {
    const { colors } = useTheme();
    const { direction } = useLocale();
    const renderTabBar = ({ 
    /* eslint-disable @typescript-eslint/no-unused-vars */
    navigationState, options, 
    /* eslint-enable @typescript-eslint/no-unused-vars */
    ...rest }) => {
        return tabBar({
            ...rest,
            state,
            navigation,
            descriptors,
        });
    };
    const focusedOptions = descriptors[state.routes[state.index].key].options;
    return (<TabView {...rest} onIndexChange={(index) => {
            const route = state.routes[index];
            navigation.dispatch({
                ...CommonActions.navigate(route),
                target: state.key,
            });
        }} renderScene={({ route, position }) => (<TabAnimationContext.Provider value={{ position }}>
          {descriptors[route.key].render()}
        </TabAnimationContext.Provider>)} navigationState={state} renderTabBar={renderTabBar} renderLazyPlaceholder={({ route }) => descriptors[route.key].options.lazyPlaceholder?.() ?? null} lazy={({ route }) => descriptors[route.key].options.lazy === true &&
            !state.preloadedRouteKeys.includes(route.key)} lazyPreloadDistance={focusedOptions.lazyPreloadDistance} swipeEnabled={focusedOptions.swipeEnabled} animationEnabled={focusedOptions.animationEnabled} onSwipeStart={() => navigation.emit({ type: 'swipeStart' })} onSwipeEnd={() => navigation.emit({ type: 'swipeEnd' })} direction={direction} options={Object.fromEntries(state.routes.map((route) => {
            const options = descriptors[route.key]?.options;
            return [
                route.key,
                {
                    sceneStyle: [{ backgroundColor: colors.background }, options?.sceneStyle],
                },
            ];
        }))}/>);
}
//# sourceMappingURL=MaterialTopTabView.js.map