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
import { SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES, type NativeTabsViewProps } from './types';
import { convertOptionsIconToScreensPropsIcon } from './utils/optionsIconConverter';

export function NativeTabsView(props: NativeTabsViewProps) {
  const { disableIndicator, tabs, unstable_nativeProps } = props;
  const {
    android: rawAndroidProps,
    ios: _ignoredRawIosProps,
    ...rawHostRestProps
  } = unstable_nativeProps ?? {};

  const { selectedScreenKey, provenance } = useSelectedScreenKey(props);
  const onTabSelected = useOnTabSelectedHandler(props.onTabChange);

  // TODO(@ubax): add per screen labelVisibilityMode + validation function
  let labelVisibilityMode = props.labelVisibilityMode;
  if (labelVisibilityMode && !supportedTabBarItemLabelVisibilityModesSet.has(labelVisibilityMode)) {
    console.warn(
      `Unsupported labelVisibilityMode: ${labelVisibilityMode}. Supported values are: ${SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES.map((mode) => `"${mode}"`).join(', ')}`
    );
    labelVisibilityMode = undefined;
  }

  const androidAppearances = tabs.map((tab) =>
    createAndroidScreenAppearance({
      options: tab.options,
      tintColor: props.tintColor,
      rippleColor: props.rippleColor,
      disableIndicator,
      labelVisibilityMode,
    })
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
      // TODO(@ubax): Adjust docs and add support for tabBarRespectsIMEInsets
      android={{ ...rawAndroidProps }}
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
