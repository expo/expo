import React, { useDeferredValue } from 'react';
import type { ColorValue } from 'react-native';
import {
  BottomTabs,
  BottomTabsScreen,
  featureFlags,
  type BottomTabsProps,
  type BottomTabsScreenAppearance,
  type BottomTabsScreenItemAppearance,
  type BottomTabsScreenItemStateAppearance,
  type BottomTabsScreenProps,
} from 'react-native-screens';

import {
  SUPPORTED_BLUR_EFFECTS,
  SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES,
  SUPPORTED_TAB_BAR_MINIMIZE_BEHAVIORS,
  type NativeTabOptions,
  type NativeTabsBlurEffect,
  type NativeTabsLabelStyle,
  type NativeTabsViewProps,
} from './types';
import { getValueFromTypeOrRecord, shouldTabBeVisible } from './utils';

// We let native tabs to control the changes. This requires freeze to be disabled for tab bar.
// Otherwise user may see glitches when switching between tabs.
featureFlags.experiment.controlledBottomTabs = false;

export function NativeTabsView(props: NativeTabsViewProps) {
  const { builder, minimizeBehavior, disableIndicator, focusedIndex, scrollEdgeAppearanceProps } =
    props;
  const { state, descriptors, navigation } = builder;
  const { routes } = state;

  const deferredFocusedIndex = useDeferredValue(focusedIndex);
  let standardAppearance = convertStyleToAppearance({
    ...props.labelStyle,
    iconColor: getValueFromTypeOrRecord(props.iconColor, 'standard'),
    blurEffect: props.blurEffect,
    backgroundColor: props.backgroundColor,
    badgeBackgroundColor: getValueFromTypeOrRecord(props.badgeBackgroundColor, 'standard'),
  });
  if (props.tintColor) {
    standardAppearance = appendSelectedStyleToAppearance(
      { iconColor: props.tintColor, color: props.tintColor },
      standardAppearance
    );
  }
  const scrollEdgeAppearance = convertStyleToAppearance({
    ...props.scrollEdgeAppearanceProps?.ios26LabelStyle,
    iconColor: getValueFromTypeOrRecord(scrollEdgeAppearanceProps?.ios26IconColor, 'standard'),
    blurEffect: scrollEdgeAppearanceProps?.blurEffect,
    backgroundColor: scrollEdgeAppearanceProps?.backgroundColor,
    badgeBackgroundColor: getValueFromTypeOrRecord(
      scrollEdgeAppearanceProps?.ios26BadgeBackgroundColor,
      'standard'
    ),
  });

  const children = routes
    .map((route, index) => ({ route, index }))
    .filter(({ route: { key } }) => shouldTabBeVisible(descriptors[key].options))
    .map(({ route, index }) => {
      const descriptor = descriptors[route.key];
      const isFocused = index === deferredFocusedIndex;

      return (
        <Screen
          key={route.key}
          routeKey={route.key}
          name={route.name}
          descriptor={descriptor}
          isFocused={isFocused}
          baseStandardAppearance={standardAppearance}
          baseScrollEdgeAppearance={scrollEdgeAppearance}
          badgeTextColor={props.badgeTextColor}
        />
      );
    });

  return (
    <BottomTabsWrapper
      // #region android props
      tabBarItemTitleFontColor={standardAppearance.stacked?.normal?.tabBarItemTitleFontColor}
      tabBarItemTitleFontFamily={standardAppearance.stacked?.normal?.tabBarItemTitleFontFamily}
      tabBarItemTitleFontSize={standardAppearance.stacked?.normal?.tabBarItemTitleFontSize}
      tabBarItemTitleFontWeight={standardAppearance.stacked?.normal?.tabBarItemTitleFontWeight}
      tabBarItemTitleFontStyle={standardAppearance.stacked?.normal?.tabBarItemTitleFontStyle}
      tabBarItemIconColor={standardAppearance.stacked?.normal?.tabBarItemIconColor}
      tabBarBackgroundColor={props.backgroundColor ?? undefined}
      tabBarItemRippleColor={props.rippleColor}
      tabBarItemLabelVisibilityMode={props.labelVisibilityMode}
      // TODO (android): Use values of selected appearance of focused tab
      tabBarItemIconColorActive={props?.tintColor}
      tabBarItemTitleFontColorActive={props?.tintColor}
      // tabBarItemTitleFontSizeActive={activeStyle?.fontSize}
      // tabBarItemActiveIndicatorColor={activeStyle?.indicatorColor}
      tabBarItemActiveIndicatorEnabled={!disableIndicator}
      // #endregion
      // #region iOS props
      tabBarTintColor={props?.tintColor}
      tabBarMinimizeBehavior={minimizeBehavior}
      // #endregion
      onNativeFocusChange={({ nativeEvent: { tabKey } }) => {
        const descriptor = descriptors[tabKey];
        const route = descriptor.route;
        navigation.dispatch({
          type: 'JUMP_TO',
          target: state.key,
          payload: {
            name: route.name,
          },
        });
      }}>
      {children}
    </BottomTabsWrapper>
  );
}

function Screen(props: {
  routeKey: string;
  name: string;
  descriptor: NativeTabsViewProps['builder']['descriptors'][string];
  isFocused: boolean;
  baseStandardAppearance: BottomTabsScreenAppearance;
  baseScrollEdgeAppearance: BottomTabsScreenAppearance;
  badgeTextColor: ColorValue | undefined;
}) {
  const {
    routeKey,
    name,
    descriptor,
    isFocused,
    baseStandardAppearance,
    baseScrollEdgeAppearance,
    badgeTextColor,
  } = props;
  const title = descriptor.options.title ?? name;

  const standardAppearance = appendSelectedStyleToAppearance(
    {
      ...(descriptor.options.selectedLabelStyle ?? {}),
      iconColor: getValueFromTypeOrRecord(descriptor.options.selectedIconColor, 'standard'),
      backgroundColor: getValueFromTypeOrRecord(
        descriptor.options.selectedBackgroundColor,
        'standard'
      ),
      badgeBackgroundColor: getValueFromTypeOrRecord(
        descriptor.options.selectedBadgeBackgroundColor,
        'standard'
      ),
      titlePositionAdjustment: getValueFromTypeOrRecord(
        descriptor.options.selectedTitlePositionAdjustment,
        'standard'
      ),
    },
    baseStandardAppearance
  );
  const scrollEdgeAppearance = appendSelectedStyleToAppearance(
    {
      ...(descriptor.options.selectedLabelStyle ?? {}),
      iconColor: getValueFromTypeOrRecord(descriptor.options.selectedIconColor, 'scrollEdge'),
      badgeBackgroundColor: getValueFromTypeOrRecord(
        descriptor.options.selectedBadgeBackgroundColor,
        'scrollEdge'
      ),
      titlePositionAdjustment: getValueFromTypeOrRecord(
        descriptor.options.selectedTitlePositionAdjustment,
        'scrollEdge'
      ),
    },
    baseScrollEdgeAppearance
  );
  let icon = convertOptionsIconToPropsIcon(descriptor.options.icon);

  // Fix for an issue in screens
  if (descriptor.options.role) {
    switch (descriptor.options.role) {
      case 'search':
        icon = { sfSymbolName: 'magnifyingglass' };
    }
  }

  return (
    <BottomTabsScreen
      {...descriptor.options}
      tabBarItemBadgeBackgroundColor={
        standardAppearance.stacked?.normal?.tabBarItemBadgeBackgroundColor
      }
      tabBarItemBadgeTextColor={badgeTextColor}
      standardAppearance={standardAppearance}
      scrollEdgeAppearance={scrollEdgeAppearance}
      iconResourceName={descriptor.options.icon?.drawable}
      icon={icon}
      selectedIcon={convertOptionsIconToPropsIcon(descriptor.options.selectedIcon)}
      title={title}
      freezeContents={false}
      tabKey={routeKey}
      systemItem={descriptor.options.role}
      isFocused={isFocused}>
      {descriptor.render()}
    </BottomTabsScreen>
  );
}

interface CustomStyle extends NativeTabsLabelStyle {
  iconColor?: ColorValue;
  backgroundColor?: ColorValue | null;
  blurEffect?: NativeTabsBlurEffect;
  badgeBackgroundColor?: ColorValue;
  titlePositionAdjustment?: {
    horizontal?: number;
    vertical?: number;
  };
}

function appendSelectedStyleToAppearance(
  selectedStyle: CustomStyle,
  appearance: BottomTabsScreenAppearance
): BottomTabsScreenAppearance {
  let tabBarBlurEffect = selectedStyle?.blurEffect;
  if (tabBarBlurEffect && !supportedBlurEffectsSet.has(tabBarBlurEffect)) {
    console.warn(
      `Unsupported blurEffect: ${tabBarBlurEffect}. Supported values are: ${SUPPORTED_BLUR_EFFECTS.map((effect) => `"${effect}"`).join(', ')}`
    );
    tabBarBlurEffect = undefined;
  }
  const baseItemAppearance =
    appearance.stacked || appearance.inline || appearance.compactInline || {};
  const selectedAppearance: BottomTabsScreenItemStateAppearance = {
    ...baseItemAppearance.normal,
    ...baseItemAppearance.selected,
    ...convertStyleToItemStateAppearance(selectedStyle),
  };
  const itemAppearance: BottomTabsScreenItemAppearance = {
    ...baseItemAppearance,
    selected: selectedAppearance,
    focused: selectedAppearance,
  };
  return {
    stacked: itemAppearance,
    inline: itemAppearance,
    compactInline: itemAppearance,
    tabBarBackgroundColor:
      selectedStyle.backgroundColor === null
        ? undefined
        : (selectedStyle.backgroundColor ?? appearance.tabBarBackgroundColor),
    tabBarBlurEffect: tabBarBlurEffect ?? appearance.tabBarBlurEffect,
  };
}

const supportedBlurEffectsSet = new Set<string>(SUPPORTED_BLUR_EFFECTS);

function convertStyleToAppearance(style: CustomStyle | undefined): BottomTabsScreenAppearance {
  if (!style) {
    return {};
  }
  let blurEffect = style.blurEffect;
  if (style.blurEffect && !supportedBlurEffectsSet.has(style.blurEffect)) {
    console.warn(
      `Unsupported blurEffect: ${style.blurEffect}. Supported values are: ${SUPPORTED_BLUR_EFFECTS.map(
        (effect) => `"${effect}"`
      ).join(', ')}`
    );
    blurEffect = undefined;
  }
  const stateAppearance = convertStyleToItemStateAppearance(style);
  const itemAppearance: BottomTabsScreenItemAppearance = {
    normal: stateAppearance,
    selected: stateAppearance,
    focused: stateAppearance,
    disabled: {},
  };
  return {
    inline: itemAppearance,
    stacked: itemAppearance,
    compactInline: itemAppearance,
    tabBarBackgroundColor: style?.backgroundColor ?? undefined,
    tabBarBlurEffect: blurEffect,
  };
}

function convertStyleToItemStateAppearance(
  style: CustomStyle | undefined
): BottomTabsScreenItemStateAppearance {
  if (!style) {
    return {};
  }
  const stateAppearance: BottomTabsScreenItemStateAppearance = {
    tabBarItemBadgeBackgroundColor: style.badgeBackgroundColor,
    tabBarItemTitlePositionAdjustment: style.titlePositionAdjustment,
    tabBarItemIconColor: style.iconColor,
    tabBarItemTitleFontFamily: style.fontFamily,
    tabBarItemTitleFontSize: style.fontSize,
    // Only string values are accepted by rn-screens
    tabBarItemTitleFontWeight: style?.fontWeight
      ? (String(style.fontWeight) as `${NonNullable<(typeof style)['fontWeight']>}`)
      : undefined,
    tabBarItemTitleFontStyle: style.fontStyle,
    tabBarItemTitleFontColor: style.color,
  };

  (Object.keys(stateAppearance) as (keyof BottomTabsScreenItemStateAppearance)[]).forEach((key) => {
    if (stateAppearance[key] === undefined) {
      delete stateAppearance[key];
    }
  });

  return stateAppearance;
}

function convertOptionsIconToPropsIcon(
  icon: NativeTabOptions['icon']
): BottomTabsScreenProps['icon'] {
  if (!icon) {
    return undefined;
  }
  if ('sf' in icon && icon.sf) {
    return { sfSymbolName: icon.sf };
  } else if ('src' in icon && icon.src) {
    return { templateSource: icon.src };
  }
  return undefined;
}

const supportedTabBarMinimizeBehaviorsSet = new Set<string>(SUPPORTED_TAB_BAR_MINIMIZE_BEHAVIORS);
const supportedTabBarItemLabelVisibilityModesSet = new Set<string>(
  SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES
);

function BottomTabsWrapper(props: BottomTabsProps) {
  let { tabBarMinimizeBehavior, tabBarItemLabelVisibilityMode, ...rest } = props;
  if (tabBarMinimizeBehavior && !supportedTabBarMinimizeBehaviorsSet.has(tabBarMinimizeBehavior)) {
    console.warn(
      `Unsupported minimizeBehavior: ${tabBarMinimizeBehavior}. Supported values are: ${SUPPORTED_TAB_BAR_MINIMIZE_BEHAVIORS.map((behavior) => `"${behavior}"`).join(', ')}`
    );
    tabBarMinimizeBehavior = undefined;
  }
  if (
    tabBarItemLabelVisibilityMode &&
    !supportedTabBarItemLabelVisibilityModesSet.has(tabBarItemLabelVisibilityMode)
  ) {
    console.warn(
      `Unsupported labelVisibilityMode: ${tabBarItemLabelVisibilityMode}. Supported values are: ${SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES.map((mode) => `"${mode}"`).join(', ')}`
    );
    tabBarItemLabelVisibilityMode = undefined;
  }

  return (
    <BottomTabs
      tabBarItemLabelVisibilityMode={tabBarItemLabelVisibilityMode}
      tabBarMinimizeBehavior={tabBarMinimizeBehavior}
      {...rest}
    />
  );
}
