import { useMemo } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Tabs, type TabsHostProps, type TabsScreenAppearanceIOS } from 'react-native-screens';

import { isScreens5 } from '../optional-libraries/react-native-screens';
import { useWarnOnce } from '../useDeprecated';
import { getFirstChildOfType } from '../utils/children';
import {
  type InternalTabScreenProps as SharedInternalTabScreenProps,
  ScreenContent,
  TabsScreen,
  useOnTabSelectedHandler,
  useOnTabSelectionPreventedHandler,
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

export function NativeTabsView(props: NativeTabsViewProps) {
  const {
    minimizeBehavior,
    tabs,
    sidebarAdaptable,
    preferredPlacement,
    nonTriggerChildren,
    unstable_nativeProps,
  } = props;
  // `ios`/`android` are the only platform-nested keys on `TabsHostProps`. We drop the inactive
  // platform's slice so users writing universal code don't pass Android-only props to the iOS host.
  const {
    ios: rawIosProps,
    android: _ignoredRawAndroidProps,
    ...rawHostRestProps
  } = unstable_nativeProps ?? {};

  const { selectedScreenKey, provenance } = useSelectedScreenKey(props);
  const onTabSelected = useOnTabSelectedHandler(props.onTabChange);
  const onTabSelectionPrevented = useOnTabSelectionPreventedHandler(props.onTabChange);
  const prominentScreenKey = useProminentScreenKey(tabs);

  const iosAppearances = tabs.map((tab) => ({
    standardAppearance: createStandardAppearanceFromOptions(tab.options),
    scrollEdgeAppearance: createScrollEdgeAppearanceFromOptions(tab.options),
  }));

  const bottomAccessory = useMemo(
    () => getFirstChildOfType(nonTriggerChildren, NativeTabsBottomAccessory),
    [nonTriggerChildren]
  );

  const bottomAccessoryFn = useBottomAccessoryFunctionFromBottomAccessories(bottomAccessory);

  useWarnOnce(
    'NativeTabs ignores `preferredPlacement` because `sidebarAdaptable` is `false`. ' +
      'The placement has an effect only when the tab bar can turn into a sidebar. ' +
      'Remove `sidebarAdaptable={false}` to use the placement, or remove `preferredPlacement`.',
    sidebarAdaptable === false && preferredPlacement !== undefined
  );

  if (
    process.env.NODE_ENV !== 'production' &&
    bottomAccessory &&
    rawIosProps &&
    'bottomAccessory' in rawIosProps
  ) {
    console.warn(
      '<NativeTabs.BottomAccessory> is being overridden by `unstable_nativeProps.ios.bottomAccessory`. ' +
        'Either remove the `<NativeTabs.BottomAccessory>` child or stop passing `ios.bottomAccessory` via `unstable_nativeProps`.'
    );
  }

  const children = tabs.map((tab, index) => (
    // react-native-screens picks UISearchTab vs UITab once at creation, so remount when the search role changes.
    <Screen
      key={tab.options.role === 'search' ? `${tab.name}:search` : tab.name}
      name={tab.name}
      routeKey={tab.routeKey}
      options={tab.options}
      isFocused={selectedScreenKey === tab.name}
      standardAppearance={iosAppearances[index]!.standardAppearance}
      scrollEdgeAppearance={iosAppearances[index]!.scrollEdgeAppearance}
      contentRenderer={tab.contentRenderer}
    />
  ));

  if (children.length === 0) {
    return null;
  }

  // The placement works only in `tabSidebar` mode, so setting it enables that mode.
  const tabBarControllerMode: NonNullable<TabsHostProps['ios']>['tabBarControllerMode'] =
    sidebarAdaptable === false
      ? 'tabBar'
      : sidebarAdaptable || preferredPlacement
        ? 'tabSidebar'
        : 'automatic';

  return (
    <TabsHostWrapper
      ios={{
        tabBarTintColor: props.tintColor,
        tabBarMinimizeBehavior: minimizeBehavior,
        tabBarControllerMode,
        tabBarSidebarPreferredPlacement: preferredPlacement,
        bottomAccessory: bottomAccessoryFn,
        tabBarHiddenAnimationEnabled: props.disableHiddenAnimation ? false : undefined,
        prominentScreenKey,
        ...rawIosProps,
      }}
      tabBarHidden={props.hidden}
      {...rawHostRestProps}
      navStateRequest={{ selectedScreenKey, baseProvenance: provenance }}
      onTabSelected={onTabSelected}
      onTabSelectionPrevented={onTabSelectionPrevented}>
      {children}
    </TabsHostWrapper>
  );
}

// `tabs` holds only visible tabs, so a hidden tab can never be prominent.
function useProminentScreenKey(tabs: NativeTabsViewProps['tabs']): string | undefined {
  const [prominentTab, ...otherProminentTabs] = tabs.filter((tab) => tab.options.prominent);
  useWarnOnce(
    `NativeTabs supports only one prominent tab, so only the "${prominentTab?.name}" tab is prominent. ` +
      `Remove \`prominent\` from these tabs: ${otherProminentTabs.map((tab) => `"${tab.name}"`).join(', ')}.`,
    otherProminentTabs.length > 0
  );
  return prominentTab?.name;
}

interface InternalTabScreenProps extends SharedInternalTabScreenProps {
  routeKey?: string;
  standardAppearance: TabsScreenAppearanceIOS;
  scrollEdgeAppearance: TabsScreenAppearanceIOS;
}

function Screen(props: InternalTabScreenProps) {
  const { options, standardAppearance, scrollEdgeAppearance, contentRenderer } = props;

  const shared = useSharedScreenProps(props);

  const selectedIcon = shared.selectedIcon ?? shared.icon;

  const iosIcon = convertOptionsIconToScreensPropsIcon(
    shared.icon,
    standardAppearance?.stacked?.normal?.tabBarItemIconColor
  );
  const iosSelectedIcon = convertOptionsIconToScreensPropsIcon(
    selectedIcon,
    standardAppearance?.stacked?.selected?.tabBarItemIconColor
  );

  // TODO(ENG-28937): Pass `xcasset` icons once react-native-screens 5 supports them.
  // react-native-screens 5 throws for any `xcasset` tab icon, even in one state, so drop both.
  const hasUnsupportedXcassetIcon =
    isScreens5 &&
    [iosIcon, iosSelectedIcon].some((converted) => converted?.icon.type === 'xcasset');
  useWarnOnce(
    `The "${props.name}" tab uses an \`xcasset\` icon, which NativeTabs cannot show with react-native-screens 5 yet. ` +
      'Use the `sf` or `src` prop of `NativeTabs.Trigger.Icon` instead.',
    hasUnsupportedXcassetIcon
  );

  const content = <ScreenContent options={options} contentRenderer={contentRenderer} />;
  const wrappedContent = useMemo(() => <SafeAreaProvider>{content}</SafeAreaProvider>, [content]);

  return (
    <TabsScreen
      {...shared.options}
      pointerEvents={shared.pointerEvents}
      ios={{
        icon: !hasUnsupportedXcassetIcon && iosIcon?.platform === 'ios' ? iosIcon.icon : undefined,
        selectedIcon:
          !hasUnsupportedXcassetIcon && iosSelectedIcon?.platform === 'ios'
            ? iosSelectedIcon.icon
            : undefined,
        standardAppearance,
        scrollEdgeAppearance,
        systemItem: options.role,
        // On by default: on iOS 27, UIKit detaches the search tab only while activation is on.
        ...(options.role === 'search'
          ? {
              role: 'search',
              automaticallyActivatesSearch: !options.disableAutomaticSearchActivation,
            }
          : {}),
        overrideScrollViewContentInsetAdjustmentBehavior: !options.disableAutomaticContentInsets,
        ...shared.nativeIosOverrides,
      }}
      title={shared.title}
      preventNativeSelection={options.disabled}
      {...shared.nativeRestOverrides}
      screenKey={shared.screenKey}
      nativeID={props.routeKey ? `expo-router-tab:${props.routeKey}` : undefined}>
      {wrappedContent}
    </TabsScreen>
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
