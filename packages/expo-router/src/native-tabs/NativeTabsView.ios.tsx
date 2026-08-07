import { useMemo } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Tabs, type TabsHostProps, type TabsScreenAppearanceIOS } from 'react-native-screens';

import { getFirstChildOfType } from '../utils/children';
import {
  type InternalTabScreenProps as SharedInternalTabScreenProps,
  ScreenContent,
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
import {
  convertOptionsIconToScreensPropsIcon,
  resolveIconRenderingMode,
} from './utils/optionsIconConverter';

export function NativeTabsView(props: NativeTabsViewProps) {
  const { minimizeBehavior, tabs, sidebarAdaptable, nonTriggerChildren, unstable_nativeProps } =
    props;
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

  const iosAppearances = tabs.map((tab) => ({
    standardAppearance: createStandardAppearanceFromOptions(tab.options),
    scrollEdgeAppearance: createScrollEdgeAppearanceFromOptions(tab.options),
  }));

  const bottomAccessory = useMemo(
    () => getFirstChildOfType(nonTriggerChildren, NativeTabsBottomAccessory),
    [nonTriggerChildren]
  );

  const bottomAccessoryFn = useBottomAccessoryFunctionFromBottomAccessories(bottomAccessory);

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
    <Screen
      key={tab.name}
      name={tab.name}
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

  const tabBarControllerMode: NonNullable<TabsHostProps['ios']>['tabBarControllerMode'] =
    sidebarAdaptable ? 'tabSidebar' : sidebarAdaptable === false ? 'tabBar' : 'automatic';

  return (
    <TabsHostWrapper
      ios={{
        tabBarTintColor: props.tintColor,
        tabBarMinimizeBehavior: minimizeBehavior,
        tabBarControllerMode,
        bottomAccessory: bottomAccessoryFn,
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

interface InternalTabScreenProps extends SharedInternalTabScreenProps {
  standardAppearance: TabsScreenAppearanceIOS;
  scrollEdgeAppearance: TabsScreenAppearanceIOS;
}

function Screen(props: InternalTabScreenProps) {
  const { options, standardAppearance, scrollEdgeAppearance, contentRenderer } = props;

  const shared = useSharedScreenProps(props);

  const selectedIcon = shared.selectedIcon ?? shared.icon;

  // React Native Screens requires `icon` and `selectedIcon` to resolve to the same icon type and
  // throws otherwise, so both states have to share a rendering mode. The two can disagree when a
  // color is set for only one of the states, or when `renderingMode` is set explicitly.
  const normalRenderingMode = resolveIconRenderingMode(
    shared.icon,
    standardAppearance?.stacked?.normal?.tabBarItemIconColor
  );
  const selectedRenderingMode = resolveIconRenderingMode(
    selectedIcon,
    standardAppearance?.stacked?.selected?.tabBarItemIconColor
  );

  if (
    process.env.NODE_ENV !== 'production' &&
    normalRenderingMode &&
    selectedRenderingMode &&
    normalRenderingMode !== selectedRenderingMode
  ) {
    console.warn(
      'NativeTabs does not currently support rendering icons in different modes. ' +
        'This issue may occur if you specify a color only for the standard or selected icon, ' +
        'or if you explicitly set renderingMode.'
    );
  }

  // The normal state wins, so the selected icon follows the mode the tab bar shows most of the time.
  const renderingMode = normalRenderingMode ?? selectedRenderingMode;

  const iosIcon = convertOptionsIconToScreensPropsIcon(shared.icon, renderingMode);
  const iosSelectedIcon = convertOptionsIconToScreensPropsIcon(selectedIcon, renderingMode);

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
      preventNativeSelection={options.disabled}
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
