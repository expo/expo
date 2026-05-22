import { useMemo } from 'react';
import { Tabs, type TabsScreenAppearanceAndroid } from 'react-native-screens';
import { SafeAreaView } from 'react-native-screens/experimental';

import {
  type InternalTabScreenProps as SharedInternalTabScreenProps,
  ScreenContent,
  useOnTabSelectedHandler,
  useSelectedScreenKey,
  useSharedScreenProps,
} from './NativeTabsView.shared';
import { createAndroidScreenAppearance } from './appearance';
import {
  SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES,
  type NativeTabOptions,
  type NativeTabsViewProps,
} from './types';
import { convertOptionsIconToScreensPropsIcon } from './utils/optionsIconConverter';

export function NativeTabsView(props: NativeTabsViewProps) {
  const { tabBarRespectsIMEInsets, tabs, unstable_nativeProps } = props;
  const {
    android: rawAndroidProps,
    ios: _ignoredRawIosProps,
    ...rawHostRestProps
  } = unstable_nativeProps ?? {};

  const { selectedScreenKey, provenance } = useSelectedScreenKey(props);
  const onTabSelected = useOnTabSelectedHandler(props.onTabChange);

  const androidAppearances = useMemo(
    () => tabs.map((tab) => createAndroidScreenAppearance(sanitizeAndroidOptions(tab.options))),
    [tabs]
  );

  const children = tabs.map((tab, index) => (
    <Screen
      key={tab.routeKey}
      routeKey={tab.routeKey}
      name={tab.name}
      options={tab.options}
      isFocused={selectedScreenKey === tab.routeKey}
      androidAppearance={androidAppearances[index]!}
      contentRenderer={tab.contentRenderer}
    />
  ));

  if (children.length === 0) {
    return null;
  }

  return (
    <Tabs.Host
      android={{
        tabBarRespectsIMEInsets: !!tabBarRespectsIMEInsets,
        ...rawAndroidProps,
      }}
      tabBarHidden={props.hidden}
      {...rawHostRestProps}
      navStateRequest={{ selectedScreenKey, baseProvenance: provenance }}
      onTabSelected={onTabSelected}>
      {children}
    </Tabs.Host>
  );
}

interface InternalTabScreenProps extends SharedInternalTabScreenProps {
  androidAppearance: TabsScreenAppearanceAndroid;
}

function Screen(props: InternalTabScreenProps) {
  const { options, androidAppearance, contentRenderer } = props;

  const shared = useSharedScreenProps(props);

  const androidIcon = convertOptionsIconToScreensPropsIcon(shared.icon);
  const androidSelectedIcon = convertOptionsIconToScreensPropsIcon(shared.selectedIcon);

  const content = <ScreenContent options={options} contentRenderer={contentRenderer} />;
  const wrappedContent = useMemo(() => {
    if (!options.disableAutomaticContentInsets) {
      return (
        <SafeAreaView
          // https://github.com/software-mansion/react-native-screens/issues/2662#issuecomment-2757735088
          collapsable={false}
          style={{ flex: 1 }}
          edges={{ bottom: true }}>
          {content}
        </SafeAreaView>
      );
    }
    return content;
  }, [content, options.disableAutomaticContentInsets]);

  return (
    <Tabs.Screen
      {...shared.options}
      pointerEvents={shared.pointerEvents}
      android={{
        icon: androidIcon,
        selectedIcon: androidSelectedIcon,
        standardAppearance: androidAppearance,
        ...shared.nativeAndroidOverrides,
      }}
      title={shared.title}
      preventNativeSelection={options.disabled}
      {...shared.nativeRestOverrides}
      screenKey={shared.screenKey}>
      {wrappedContent}
    </Tabs.Screen>
  );
}

const supportedTabBarItemLabelVisibilityModesSet = new Set<string>(
  SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES
);

function sanitizeAndroidOptions(options: NativeTabOptions): NativeTabOptions {
  if (
    options.labelVisibilityMode &&
    !supportedTabBarItemLabelVisibilityModesSet.has(options.labelVisibilityMode)
  ) {
    console.warn(
      `Unsupported labelVisibilityMode: ${options.labelVisibilityMode}. Supported values are: ${SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES.map((mode) => `"${mode}"`).join(', ')}`
    );
    return { ...options, labelVisibilityMode: undefined };
  }
  return options;
}
