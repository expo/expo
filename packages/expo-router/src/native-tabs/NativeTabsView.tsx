import React, { useMemo } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  Tabs,
  type TabsHostProps,
  type TabsScreenAppearanceAndroid,
  type TabsScreenAppearanceIOS,
} from 'react-native-screens';
import { SafeAreaView } from 'react-native-screens/experimental';

import {
  createAndroidScreenAppearance,
  createScrollEdgeAppearanceFromOptions,
  createStandardAppearanceFromOptions,
} from './appearance';
import { NativeTabsBottomAccessory } from './common/elements';
import {
  SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES,
  SUPPORTED_TAB_BAR_MINIMIZE_BEHAVIORS,
  type NativeTabOptions,
  type NativeTabsViewProps,
} from './types';
import { useTheme } from '../react-navigation/native';
import { useBottomAccessoryFunctionFromBottomAccessories } from './utils/bottomAccessory';
import {
  convertOptionsIconToAndroidPropsIcon,
  convertOptionsIconToIOSPropsIcon,
  useAwaitedScreensIcon,
} from './utils/icon';
import { getFirstChildOfType } from '../utils/children';

// TODO(@ubax): add per platform implementations splitted into .platform files
export function NativeTabsView(props: NativeTabsViewProps) {
  const {
    minimizeBehavior,
    disableIndicator,
    focusedIndex,
    provenance,
    tabs,
    sidebarAdaptable,
    nonTriggerChildren,
  } = props;

  // TODO(@ubax): Fix native tabs for heavy tabs
  const deferredFocusedIndex = focusedIndex;
  // const deferredFocusedIndex = useDeferredValue(focusedIndex);
  // We need to check if the deferred index is not out of bounds
  // This can happen when the focused index is the last tab, and user removes that tab
  // In that case the deferred index will still point to the last tab, but after re-render
  // it will be out of bounds
  const inBoundsDeferredFocusedIndex =
    deferredFocusedIndex < tabs.length ? deferredFocusedIndex : focusedIndex;

  const selectedScreenKey = tabs[inBoundsDeferredFocusedIndex]!.routeKey;

  const iosAppearances = tabs.map((tab) =>
    process.env.EXPO_OS !== 'ios'
      ? undefined
      : {
          standardAppearance: createStandardAppearanceFromOptions(tab.options),
          scrollEdgeAppearance: createScrollEdgeAppearanceFromOptions(tab.options),
        }
  );
  const androidAppearances = tabs.map((tab) =>
    process.env.EXPO_OS !== 'android'
      ? undefined
      : createAndroidScreenAppearance({
          options: tab.options,
          tintColor: props.tintColor,
          rippleColor: props.rippleColor,
          disableIndicator,
          labelVisibilityMode,
        })
  );

  const bottomAccessory = useMemo(
    () => getFirstChildOfType(nonTriggerChildren, NativeTabsBottomAccessory),
    [nonTriggerChildren]
  );

  const bottomAccessoryFn = useBottomAccessoryFunctionFromBottomAccessories(bottomAccessory);

  // TODO(@ubax): add per screen labelVisibilityMode + validation function
  let labelVisibilityMode = props.labelVisibilityMode;
  if (labelVisibilityMode && !supportedTabBarItemLabelVisibilityModesSet.has(labelVisibilityMode)) {
    console.warn(
      `Unsupported labelVisibilityMode: ${labelVisibilityMode}. Supported values are: ${SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES.map((mode) => `"${mode}"`).join(', ')}`
    );
    labelVisibilityMode = undefined;
  }

  const children = tabs.map((tab, index) => (
    <Screen
      key={tab.routeKey}
      routeKey={tab.routeKey}
      name={tab.name}
      options={tab.options}
      isFocused={selectedScreenKey === tab.routeKey}
      standardAppearance={iosAppearances[index]?.standardAppearance}
      scrollEdgeAppearance={iosAppearances[index]?.scrollEdgeAppearance}
      androidAppearance={androidAppearances[index]}
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
      // TODO(@ubax): Adjust docs and add support for tabBarRespectsIMEInsets
      android={{}}
      tabBarHidden={props.hidden}
      onTabSelected={({
        nativeEvent: { selectedScreenKey, provenance: nextProvenance, isNativeAction },
      }) => {
        props.onTabChange({
          selectedKey: selectedScreenKey,
          provenance: nextProvenance,
          isNativeAction,
        });
      }}>
      {children}
    </TabsHostWrapper>
  );
}

interface InternalTabScreenProps {
  routeKey: string;
  name: string;
  // TODO(@ubax): https://linear.app/expo/issue/ENG-20736/remove-pointerevents-from-nativetabsview
  isFocused: boolean;
  options: NativeTabOptions;
  standardAppearance: TabsScreenAppearanceIOS | undefined;
  scrollEdgeAppearance: TabsScreenAppearanceIOS | undefined;
  androidAppearance: TabsScreenAppearanceAndroid | undefined;
  contentRenderer: () => React.ReactNode;
}

function Screen(props: InternalTabScreenProps) {
  const {
    routeKey,
    name,
    options,
    // TODO(@ubax): https://linear.app/expo/issue/ENG-20736/remove-pointerevents-from-nativetabsview
    isFocused,
    standardAppearance,
    scrollEdgeAppearance,
    androidAppearance,
    contentRenderer,
  } = props;
  const title = options.title ?? name;

  // We need to await the icon, as VectorIcon will load asynchronously
  const icon = useAwaitedScreensIcon(options.icon);
  const selectedIcon = useAwaitedScreensIcon(options.selectedIcon);
  const { colors } = useTheme();

  const iosIcon = convertOptionsIconToIOSPropsIcon(
    icon,
    standardAppearance?.stacked?.normal?.tabBarItemIconColor
  );
  const iosSelectedIcon = convertOptionsIconToIOSPropsIcon(
    selectedIcon,
    standardAppearance?.stacked?.selected?.tabBarItemIconColor
  );
  const androidIcon = icon ? convertOptionsIconToAndroidPropsIcon(icon) : undefined;
  const androidSelectedIcon = selectedIcon
    ? convertOptionsIconToAndroidPropsIcon(selectedIcon)
    : undefined;

  const content = (
    <View
      // https://github.com/software-mansion/react-native-screens/issues/2662#issuecomment-2757735088
      collapsable={false}
      style={[
        { backgroundColor: colors.background },
        options.contentStyle,
        { flex: 1, position: 'relative', overflow: 'hidden' },
      ]}>
      {contentRenderer()}
    </View>
  );
  const wrappedContent = useMemo(() => {
    if (process.env.EXPO_OS === 'android' && !options.disableAutomaticContentInsets) {
      return (
        <SafeAreaView
          // https://github.com/software-mansion/react-native-screens/issues/2662#issuecomment-2757735088
          collapsable={false}
          style={{ flex: 1 }}
          edges={{ bottom: true }}>
          {content}
        </SafeAreaView>
      );
    } else if (process.env.EXPO_OS === 'ios') {
      return <SafeAreaProvider>{content}</SafeAreaProvider>;
    } else {
      return content;
    }
  }, [content, options.disableAutomaticContentInsets]);

  const {
    ios: nativeIosOverrides,
    android: nativeAndroidOverrides,
    ...nativeRestOverrides
  } = options.nativeProps ?? {};

  return (
    <Tabs.Screen
      {...options}
      // TODO(@ubax): https://linear.app/expo/issue/ENG-20736/remove-pointerevents-from-nativetabsview
      pointerEvents={isFocused ? 'box-none' : 'none'}
      ios={{
        icon: iosIcon,
        selectedIcon: iosSelectedIcon,
        standardAppearance,
        scrollEdgeAppearance,
        systemItem: options.role,
        overrideScrollViewContentInsetAdjustmentBehavior: !options.disableAutomaticContentInsets,
        ...nativeIosOverrides,
      }}
      android={{
        icon: androidIcon,
        selectedIcon: androidSelectedIcon,
        standardAppearance: androidAppearance,
        ...nativeAndroidOverrides,
      }}
      title={title}
      {...nativeRestOverrides}
      screenKey={routeKey}>
      {wrappedContent}
    </Tabs.Screen>
  );
}

const supportedTabBarMinimizeBehaviorsSet = new Set<string>(SUPPORTED_TAB_BAR_MINIMIZE_BEHAVIORS);
const supportedTabBarItemLabelVisibilityModesSet = new Set<string>(
  SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES
);

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
