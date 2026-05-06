import { useMemo } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Tabs, type TabsHostProps, type TabsScreenAppearanceIOS } from 'react-native-screens';

import {
  type InternalTabScreenProps as SharedInternalTabScreenProps,
  ScreenContent,
  useOnTabSelectedHandler,
  useSelectedScreenKey,
  useSharedScreenProps,
} from './NativeTabsView.shared';
import {
  createScrollEdgeAppearanceFromOptions,
  createStandardAppearanceFromOptions,
} from './appearance';
import { NativeTabsBottomAccessory } from './common/elements';
import { SUPPORTED_TAB_BAR_MINIMIZE_BEHAVIORS, type NativeTabsViewProps } from './types';
import { useBottomAccessoryFunctionFromBottomAccessories } from './utils/bottomAccessory';
import { convertOptionsIconToScreensPropsIcon } from './utils/optionsIconConverter';
import { getFirstChildOfType } from '../utils/children';

export function NativeTabsView(props: NativeTabsViewProps) {
  const { minimizeBehavior, tabs, sidebarAdaptable, nonTriggerChildren } = props;

  const { selectedScreenKey, provenance } = useSelectedScreenKey(props);
  const onTabSelected = useOnTabSelectedHandler(props.onTabChange);

  const iosAppearances = tabs.map((tab) => ({
    standardAppearance: createStandardAppearanceFromOptions(tab.options),
    scrollEdgeAppearance: createScrollEdgeAppearanceFromOptions(tab.options),
  }));

  const bottomAccessory = useMemo(
    () => getFirstChildOfType(nonTriggerChildren, NativeTabsBottomAccessory),
    [nonTriggerChildren]
  );

  const bottomAccessoryFn = useBottomAccessoryFunctionFromBottomAccessories(bottomAccessory);

  const children = tabs.map((tab, index) => (
    <Screen
      key={tab.routeKey}
      routeKey={tab.routeKey}
      name={tab.name}
      options={tab.options}
      isFocused={selectedScreenKey === tab.routeKey}
      standardAppearance={iosAppearances[index]!.standardAppearance}
      scrollEdgeAppearance={iosAppearances[index]!.scrollEdgeAppearance}
      contentRenderer={tab.contentRenderer}
    />
  ));

  if (children.length === 0) {
    return null;
  }

  const tabBarControllerMode: NonNullable<TabsHostProps['ios']>['tabBarControllerMode'] =
    sidebarAdaptable ? 'tabSidebar' : sidebarAdaptable === false ? 'tabBar' : 'automatic';

  return (
    // TODO(@ubax): add rawProps prop to tab host
    <TabsHostWrapper
      navState={{ selectedScreenKey, provenance }}
      ios={{
        tabBarTintColor: props.tintColor,
        tabBarMinimizeBehavior: minimizeBehavior,
        tabBarControllerMode,
        bottomAccessory: bottomAccessoryFn,
      }}
      tabBarHidden={props.hidden}
      onTabSelected={onTabSelected}>
      {children}
    </TabsHostWrapper>
  );
}

interface InternalTabScreenProps extends SharedInternalTabScreenProps {
  standardAppearance: TabsScreenAppearanceIOS;
  scrollEdgeAppearance: TabsScreenAppearanceIOS;
}

function Screen(props: InternalTabScreenProps) {
  const { options, standardAppearance, scrollEdgeAppearance, contentRenderer } = props;

  const shared = useSharedScreenProps(props);

  const iosIcon = convertOptionsIconToScreensPropsIcon(
    shared.icon,
    standardAppearance?.stacked?.normal?.tabBarItemIconColor
  );
  const iosSelectedIcon = convertOptionsIconToScreensPropsIcon(
    shared.selectedIcon,
    standardAppearance?.stacked?.selected?.tabBarItemIconColor
  );

  const content = <ScreenContent options={options} contentRenderer={contentRenderer} />;
  const wrappedContent = useMemo(() => <SafeAreaProvider>{content}</SafeAreaProvider>, [content]);

  return (
    <Tabs.Screen
      {...shared.options}
      pointerEvents={shared.pointerEvents}
      ios={{
        icon: iosIcon,
        selectedIcon: iosSelectedIcon,
        standardAppearance,
        scrollEdgeAppearance,
        systemItem: options.role,
        overrideScrollViewContentInsetAdjustmentBehavior: !options.disableAutomaticContentInsets,
        ...shared.nativeIosOverrides,
      }}
      title={shared.title}
      {...shared.nativeRestOverrides}
      screenKey={shared.screenKey}>
      {wrappedContent}
    </Tabs.Screen>
  );
}

const supportedTabBarMinimizeBehaviorsSet = new Set<string>(SUPPORTED_TAB_BAR_MINIMIZE_BEHAVIORS);

function TabsHostWrapper(props: TabsHostProps) {
  // TODO(@ubax): add function for validation
  let validatedIos = props.ios;
  if (validatedIos?.tabBarMinimizeBehavior) {
    if (!supportedTabBarMinimizeBehaviorsSet.has(validatedIos.tabBarMinimizeBehavior)) {
      console.warn(
        `Unsupported minimizeBehavior: ${validatedIos.tabBarMinimizeBehavior}. Supported values are: ${SUPPORTED_TAB_BAR_MINIMIZE_BEHAVIORS.map((behavior) => `"${behavior}"`).join(', ')}`
      );
      validatedIos = { ...validatedIos, tabBarMinimizeBehavior: undefined };
    }
  }

  return <Tabs.Host {...props} ios={validatedIos} />;
}
