import { getHeaderTitle, HeaderTitle } from '@react-navigation/elements';
import {
  type Route,
  type Theme,
  useLocale,
  useTheme,
} from '@react-navigation/native';
import color from 'color';
import { Platform, StyleSheet, type TextStyle, View } from 'react-native';
import {
  type HeaderBarButtonItemMenuAction,
  type HeaderBarButtonItemSubmenu,
  type HeaderBarButtonItemWithAction,
  type HeaderBarButtonItemWithMenu,
  isSearchBarAvailableForCurrentPlatform,
  ScreenStackHeaderBackButtonImage,
  ScreenStackHeaderCenterView,
  type ScreenStackHeaderConfigProps,
  ScreenStackHeaderLeftView,
  ScreenStackHeaderRightView,
  ScreenStackHeaderSearchBarView,
  SearchBar,
} from 'react-native-screens';

import type {
  NativeStackHeaderItem,
  NativeStackHeaderItemButton,
  NativeStackHeaderItemMenuAction,
  NativeStackHeaderItemMenuSubmenu,
  NativeStackNavigationOptions,
} from '../types';
import { processFonts } from './FontProcessor';

type Props = NativeStackNavigationOptions & {
  headerTopInsetEnabled: boolean;
  headerHeight: number;
  headerBack: { title?: string | undefined; href: undefined } | undefined;
  route: Route<string>;
};

const processBarButtonItems = (
  items: NativeStackHeaderItem[] | undefined,
  colors: Theme['colors'],
  fonts: Theme['fonts']
) => {
  return items
    ?.map((item, index) => {
      if (item.type === 'custom') {
        // Handled with `ScreenStackHeaderLeftView` or `ScreenStackHeaderRightView`
        return null;
      }

      if (item.type === 'spacing') {
        if (item.spacing == null) {
          throw new Error(
            `Spacing item must have a 'spacing' property defined: ${JSON.stringify(
              item
            )}`
          );
        }

        return item;
      }

      if (item.type === 'button' || item.type === 'menu') {
        if (item.type === 'menu' && item.menu == null) {
          throw new Error(
            `Menu item must have a 'menu' property defined: ${JSON.stringify(
              item
            )}`
          );
        }

        const { badge, label, labelStyle, icon, ...rest } = item;

        const processedItemCommon = {
          ...rest,
          index,
          title: label,
          titleStyle: {
            ...fonts.regular,
            ...labelStyle,
          },
          icon: transformIcon(icon),
        };

        let processedItem:
          | HeaderBarButtonItemWithAction
          | HeaderBarButtonItemWithMenu;

        if (processedItemCommon.type === 'menu' && item.type === 'menu') {
          const { multiselectable, layout } = item.menu;

          processedItem = {
            ...processedItemCommon,
            menu: {
              ...processedItemCommon.menu,
              singleSelection: !multiselectable,
              displayAsPalette: layout === 'palette',
              items: item.menu.items.map(getMenuItem),
            },
          };
        } else if (
          processedItemCommon.type === 'button' &&
          item.type === 'button'
        ) {
          processedItem = processedItemCommon;
        } else {
          throw new Error(
            `Invalid item type: ${JSON.stringify(item)}. Valid types are 'button' and 'menu'.`
          );
        }

        if (badge) {
          const badgeBackgroundColor =
            badge.style?.backgroundColor ?? colors.notification;
          const badgeTextColor = color(badgeBackgroundColor).isLight()
            ? 'black'
            : 'white';

          processedItem = {
            ...processedItem,
            badge: {
              ...badge,
              value: String(badge.value),
              style: {
                backgroundColor: badgeBackgroundColor,
                color: badgeTextColor,
                ...fonts.regular,
                ...badge.style,
              },
            },
          };
        }

        return processedItem;
      }

      throw new Error(
        `Invalid item type: ${JSON.stringify(item)}. Valid types are 'button', 'menu', 'custom' and 'spacing'.`
      );
    })
    .filter((item) => item != null);
};

const transformIcon = (
  icon: NativeStackHeaderItemButton['icon']
):
  | HeaderBarButtonItemWithAction['icon']
  | HeaderBarButtonItemWithMenu['icon'] => {
  if (icon?.type === 'image') {
    return icon.tinted === false
      ? { type: 'imageSource', imageSource: icon.source }
      : { type: 'templateSource', templateSource: icon.source };
  }

  return icon;
};

const getMenuItem = (
  item: NativeStackHeaderItemMenuAction | NativeStackHeaderItemMenuSubmenu
): HeaderBarButtonItemMenuAction | HeaderBarButtonItemSubmenu => {
  if (item.type === 'submenu') {
    const { label, icon, inline, layout, items, multiselectable, ...rest } =
      item;

    return {
      ...rest,
      icon: transformIcon(icon),
      title: label,
      displayAsPalette: layout === 'palette',
      displayInline: inline,
      singleSelection: !multiselectable,
      items: items.map(getMenuItem),
    };
  }

  const { label, icon, description, ...rest } = item;

  return {
    ...rest,
    icon: transformIcon(icon),
    title: label,
    subtitle: description,
  };
};

export function useHeaderConfigProps({
  headerBackIcon,
  headerBackImageSource,
  headerBackButtonDisplayMode,
  headerBackButtonMenuEnabled,
  headerBackTitle,
  headerBackTitleStyle,
  headerBackVisible,
  headerShadowVisible,
  headerLargeStyle,
  headerLargeTitle: headerLargeTitleDeprecated,
  headerLargeTitleEnabled = headerLargeTitleDeprecated,
  headerLargeTitleShadowVisible,
  headerLargeTitleStyle,
  headerBackground,
  headerLeft,
  headerRight,
  headerShown,
  headerStyle,
  headerBlurEffect,
  headerTintColor,
  headerTitle,
  headerTitleAlign,
  headerTitleStyle,
  headerTransparent,
  headerSearchBarOptions,
  headerTopInsetEnabled,
  headerBack,
  route,
  title,
  unstable_headerLeftItems: headerLeftItems,
  unstable_headerRightItems: headerRightItems,
}: Props): ScreenStackHeaderConfigProps {
  const { direction } = useLocale();
  const { colors, fonts, dark } = useTheme();
  const tintColor =
    headerTintColor ?? (Platform.OS === 'ios' ? colors.primary : colors.text);

  const headerBackTitleStyleFlattened =
    StyleSheet.flatten([fonts.regular, headerBackTitleStyle]) || {};
  const headerLargeTitleStyleFlattened =
    StyleSheet.flatten([
      Platform.select({ ios: fonts.heavy, default: fonts.medium }),
      headerLargeTitleStyle,
    ]) || {};
  const headerTitleStyleFlattened =
    StyleSheet.flatten([
      Platform.select({ ios: fonts.bold, default: fonts.medium }),
      headerTitleStyle,
    ]) || {};
  const headerStyleFlattened = StyleSheet.flatten(headerStyle) || {};
  const headerLargeStyleFlattened = StyleSheet.flatten(headerLargeStyle) || {};

  const [backTitleFontFamily, largeTitleFontFamily, titleFontFamily] =
    processFonts([
      headerBackTitleStyleFlattened.fontFamily,
      headerLargeTitleStyleFlattened.fontFamily,
      headerTitleStyleFlattened.fontFamily,
    ]);

  const backTitleFontSize =
    'fontSize' in headerBackTitleStyleFlattened
      ? headerBackTitleStyleFlattened.fontSize
      : undefined;

  const titleText = getHeaderTitle({ title, headerTitle }, route.name);
  const titleColor =
    'color' in headerTitleStyleFlattened
      ? headerTitleStyleFlattened.color
      : (headerTintColor ?? colors.text);
  const titleFontSize =
    'fontSize' in headerTitleStyleFlattened
      ? headerTitleStyleFlattened.fontSize
      : undefined;
  const titleFontWeight = headerTitleStyleFlattened.fontWeight;

  const largeTitleBackgroundColor = headerLargeStyleFlattened.backgroundColor;
  const largeTitleColor =
    'color' in headerLargeTitleStyleFlattened
      ? headerLargeTitleStyleFlattened.color
      : undefined;
  const largeTitleFontSize =
    'fontSize' in headerLargeTitleStyleFlattened
      ? headerLargeTitleStyleFlattened.fontSize
      : undefined;
  const largeTitleFontWeight = headerLargeTitleStyleFlattened.fontWeight;

  const headerTitleStyleSupported: TextStyle = { color: titleColor };

  if (headerTitleStyleFlattened.fontFamily != null) {
    headerTitleStyleSupported.fontFamily = headerTitleStyleFlattened.fontFamily;
  }

  if (titleFontSize != null) {
    headerTitleStyleSupported.fontSize = titleFontSize;
  }

  if (titleFontWeight != null) {
    headerTitleStyleSupported.fontWeight = titleFontWeight;
  }

  const headerBackgroundColor =
    headerStyleFlattened.backgroundColor ??
    (headerBackground != null ||
    headerTransparent ||
    // The title becomes invisible if background color is set with large title on iOS 26
    (Platform.OS === 'ios' && headerLargeTitleEnabled)
      ? 'transparent'
      : colors.card);

  const canGoBack = headerBack != null;

  const headerLeftElement = headerLeft?.({
    tintColor,
    canGoBack,
    label: headerBackTitle ?? headerBack?.title,
    // `href` is only applicable to web
    href: undefined,
  });

  const headerRightElement = headerRight?.({
    tintColor,
    canGoBack,
  });

  const headerTitleElement =
    typeof headerTitle === 'function'
      ? headerTitle({
          tintColor,
          children: titleText,
        })
      : null;

  const supportsHeaderSearchBar =
    typeof isSearchBarAvailableForCurrentPlatform === 'boolean'
      ? isSearchBarAvailableForCurrentPlatform
      : // Fallback for older versions of react-native-screens
        Platform.OS === 'ios' && SearchBar != null;

  const hasHeaderSearchBar =
    supportsHeaderSearchBar && headerSearchBarOptions != null;

  /**
   * We need to set this in if:
   * - Back button should stay visible when `headerLeft` is specified
   * - If `headerTitle` for Android is specified, so we only need to remove the title and keep the back button
   */
  const backButtonInCustomView =
    headerBackVisible ||
    (Platform.OS === 'android' &&
      headerTitleElement != null &&
      headerLeftElement == null);

  const translucent =
    headerBackground != null ||
    headerTransparent ||
    // When using a SearchBar or large title, the header needs to be translucent for it to work on iOS
    ((hasHeaderSearchBar || headerLargeTitleEnabled) &&
      Platform.OS === 'ios' &&
      headerTransparent !== false);

  const isBackButtonDisplayModeAvailable =
    // On iOS 14+
    Platform.OS === 'ios' &&
    parseInt(Platform.Version, 10) >= 14 &&
    // Doesn't have custom styling, by default System, see: https://github.com/software-mansion/react-native-screens/pull/2105#discussion_r1565222738
    (backTitleFontFamily == null || backTitleFontFamily === 'System') &&
    backTitleFontSize == null &&
    // Back button menu is not disabled
    headerBackButtonMenuEnabled !== false;

  const isCenterViewRenderedAndroid = headerTitleAlign === 'center';

  const leftItems = headerLeftItems?.({
    tintColor,
    canGoBack,
  });

  let rightItems = headerRightItems?.({
    tintColor,
    canGoBack,
  });

  if (rightItems) {
    // iOS renders right items in reverse order
    // So we need to reverse them here to match the order
    rightItems = [...rightItems].reverse();
  }

  const children = (
    <>
      {Platform.OS === 'ios' ? (
        <>
          {leftItems ? (
            leftItems.map((item, index) => {
              if (item.type === 'custom') {
                return (
                  <ScreenStackHeaderLeftView
                    // eslint-disable-next-line @eslint-react/no-array-index-key
                    key={index}
                    hidesSharedBackground={item.hidesSharedBackground}
                  >
                    {item.element}
                  </ScreenStackHeaderLeftView>
                );
              }

              return null;
            })
          ) : headerLeftElement != null ? (
            <ScreenStackHeaderLeftView>
              {headerLeftElement}
            </ScreenStackHeaderLeftView>
          ) : null}
          {headerTitleElement != null ? (
            <ScreenStackHeaderCenterView>
              {headerTitleElement}
            </ScreenStackHeaderCenterView>
          ) : null}
        </>
      ) : (
        <>
          {headerLeftElement != null || typeof headerTitle === 'function' ? (
            // The style passed to header left, together with title element being wrapped
            // in flex view is reqruied for proper header layout, in particular,
            // for the text truncation to work.
            <ScreenStackHeaderLeftView
              style={!isCenterViewRenderedAndroid ? { flex: 1 } : null}
            >
              {headerLeftElement}
              {headerTitleAlign !== 'center' ? (
                typeof headerTitle === 'function' ? (
                  <View style={{ flex: 1 }}>{headerTitleElement}</View>
                ) : (
                  <View style={{ flex: 1 }}>
                    <HeaderTitle
                      tintColor={tintColor}
                      style={headerTitleStyleSupported}
                    >
                      {titleText}
                    </HeaderTitle>
                  </View>
                )
              ) : null}
            </ScreenStackHeaderLeftView>
          ) : null}
          {isCenterViewRenderedAndroid ? (
            <ScreenStackHeaderCenterView>
              {typeof headerTitle === 'function' ? (
                headerTitleElement
              ) : (
                <HeaderTitle
                  tintColor={tintColor}
                  style={headerTitleStyleSupported}
                >
                  {titleText}
                </HeaderTitle>
              )}
            </ScreenStackHeaderCenterView>
          ) : null}
        </>
      )}
      {headerBackIcon !== undefined || headerBackImageSource !== undefined ? (
        <ScreenStackHeaderBackButtonImage
          source={headerBackIcon?.source ?? headerBackImageSource}
        />
      ) : null}
      {Platform.OS === 'ios' && rightItems ? (
        rightItems.map((item, index) => {
          if (item.type === 'custom') {
            return (
              <ScreenStackHeaderRightView
                // eslint-disable-next-line @eslint-react/no-array-index-key
                key={index}
                hidesSharedBackground={item.hidesSharedBackground}
              >
                {item.element}
              </ScreenStackHeaderRightView>
            );
          }

          return null;
        })
      ) : headerRightElement != null ? (
        <ScreenStackHeaderRightView>
          {headerRightElement}
        </ScreenStackHeaderRightView>
      ) : null}
      {hasHeaderSearchBar ? (
        <ScreenStackHeaderSearchBarView>
          <SearchBar {...headerSearchBarOptions} />
        </ScreenStackHeaderSearchBarView>
      ) : null}
    </>
  );

  return {
    backButtonInCustomView,
    backgroundColor: headerBackgroundColor,
    backTitle: headerBackTitle,
    backTitleVisible: isBackButtonDisplayModeAvailable
      ? undefined
      : headerBackButtonDisplayMode !== 'minimal',
    backButtonDisplayMode: isBackButtonDisplayModeAvailable
      ? headerBackButtonDisplayMode
      : undefined,
    backTitleFontFamily,
    backTitleFontSize,
    blurEffect: headerBlurEffect,
    color: tintColor,
    direction,
    disableBackButtonMenu: headerBackButtonMenuEnabled === false,
    hidden: headerShown === false,
    hideBackButton: headerBackVisible === false,
    hideShadow:
      headerShadowVisible === false ||
      headerBackground != null ||
      (headerTransparent && headerShadowVisible !== true),
    largeTitle: headerLargeTitleEnabled,
    largeTitleBackgroundColor,
    largeTitleColor,
    largeTitleFontFamily,
    largeTitleFontSize,
    largeTitleFontWeight,
    largeTitleHideShadow: headerLargeTitleShadowVisible === false,
    title: titleText,
    titleColor,
    titleFontFamily,
    titleFontSize,
    titleFontWeight: String(titleFontWeight),
    topInsetEnabled: headerTopInsetEnabled,
    translucent: translucent === true,
    children,
    headerLeftBarButtonItems: processBarButtonItems(leftItems, colors, fonts),
    headerRightBarButtonItems: processBarButtonItems(rightItems, colors, fonts),
    experimental_userInterfaceStyle: dark ? 'dark' : 'light',
  } as const;
}
