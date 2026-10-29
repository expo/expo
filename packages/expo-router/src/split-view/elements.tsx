import { Children, isValidElement, type ReactNode } from 'react';
import type { ColorValue, NativeSyntheticEvent } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { SFSymbol } from 'sf-symbols-typescript';

import { SafeAreaView, Split } from '../optional-libraries/react-native-screens';
import { SplitViewColumnHeader } from './header';

export interface SplitViewToolbarItem {
  /**
   * Title of the button. When `icon` is set and `accessibilityLabel` is not, it is used as the accessibility label.
   */
  title: string;
  /**
   * SF Symbol or Xcode asset catalog image shown instead of the title.
   */
  icon?: SFSymbol | { xcasset: string };
  /**
   * Controls how the `xcasset` icon is rendered.
   *
   * - `'template'`: applies the tint color to the icon
   * - `'original'`: preserves the original colors of the icon
   *
   * @default 'template' when `tintColor` is set, otherwise 'original'
   */
  iconRenderingMode?: 'template' | 'original';
  tintColor?: ColorValue;
  /**
   * Badge shown on the button. Without `value`, the badge is a dot.
   * @platform ios 26+
   */
  badge?: {
    value?: string | number;
    style?: {
      color?: ColorValue;
      backgroundColor?: ColorValue;
      fontFamily?: string;
      fontSize?: number;
      fontWeight?: string;
    };
  };
  /**
   * @default 'plain'
   */
  variant?: 'plain' | 'done' | 'prominent';
  /**
   * Whether the button has its own background instead of sharing it with the adjacent buttons.
   * @platform ios 26+
   * @default false
   */
  separateBackground?: boolean;
  /**
   * Whether the background of the button is hidden.
   * @platform ios 26+
   * @default false
   */
  hidesSharedBackground?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /**
   * Called when the button is pressed. Not called when `menu` is set.
   */
  onPress?: () => void;
  /**
   * Menu that opens when the button is pressed.
   */
  menu?: SplitViewMenu;
  /**
   * Whether the button cannot be pressed.
   * @default false
   */
  disabled?: boolean;
  /**
   * Whether the button is in a selected state.
   *
   * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uibarbuttonitem/isselected) for more information
   * @default false
   */
  selected?: boolean;
}

export interface SplitViewMenu {
  /**
   * Title shown at the top of the menu.
   */
  title?: string;
  /**
   * Actions shown in the menu.
   */
  items: SplitViewMenuAction[];
}

export interface SplitViewMenuAction {
  /**
   * Title of the action.
   */
  title: string;
  /**
   * SF Symbol shown next to the title.
   */
  icon?: SFSymbol;
  /**
   * Called when the action is pressed.
   */
  onPress?: () => void;
  /**
   * Whether the action is shown as destructive.
   * @default false
   */
  destructive?: boolean;
  /**
   * Whether the action cannot be pressed.
   * @default false
   */
  disabled?: boolean;
  /**
   * Whether the action shows a checkmark.
   * @default false
   */
  isOn?: boolean;
}

export interface SplitViewSearchBar {
  /**
   * Text shown in the search field when it is empty.
   */
  placeholder?: string;
  /**
   * Called when the text in the search field changes.
   */
  onChangeText?: (event: NativeSyntheticEvent<{ text: string }>) => void;
  /**
   * Called when the search button on the keyboard is pressed.
   */
  onSearchButtonPress?: (event: NativeSyntheticEvent<{ text: string }>) => void;
}

export interface SplitViewHeader {
  /**
   * Title shown in the navigation bar of the column.
   */
  title?: string;
  /**
   * Subtitle shown below the title.
   * @platform ios 26+
   */
  subtitle?: string;
  /**
   * Whether the navigation bar of the column shows a large title.
   * @default false
   */
  largeTitle?: boolean;
  /**
   * Buttons shown on the leading side of the navigation bar.
   */
  leftToolbar?: SplitViewToolbarItem[];
  /**
   * Buttons shown on the trailing side of the navigation bar.
   */
  rightToolbar?: SplitViewToolbarItem[];
  /**
   * Search bar shown in the navigation bar.
   */
  searchBar?: SplitViewSearchBar;
}

export interface SplitViewColumnProps {
  children?: React.ReactNode;
  /**
   * Navigation bar of the column.
   * @platform ios
   */
  header?: SplitViewHeader;
}

export function SplitViewColumn(props: SplitViewColumnProps) {
  return <Split.Column>{getSplitColumnChildren(props)}</Split.Column>;
}

export interface SplitViewContentProps {
  /**
   * Navigation bar of the content column, which renders the current route.
   * @platform ios
   */
  header?: SplitViewHeader;
}

/**
 * Configures the content column of the SplitView. The column renders the current route.
 */
export function SplitViewContent(_props: SplitViewContentProps) {
  return null;
}

function isSplitColumnNativeChild(child: ReactNode) {
  return isValidElement(child) && (child.type === Split.Stack || child.type === Split.HeaderConfig);
}

/**
 * Split.Column must see a Split.Stack as its direct child, and the native split screen must see its header config
 * and the header view as direct subviews. Only the other children are wrapped in a SafeAreaView with horizontal
 * edges and a SafeAreaProvider. The result is an array, because Split.Column does not look into fragments.
 */
export function getSplitColumnChildren(
  { children, header }: SplitViewColumnProps,
  disableHorizontalSafeAreaInsets?: boolean
) {
  const childrenArray = Children.toArray(children);
  const nativeChildren = childrenArray.filter(isSplitColumnNativeChild);
  const otherChildren = childrenArray.filter((child) => !isSplitColumnNativeChild(child));
  let content: ReactNode = otherChildren.length > 0 && (
    <SafeAreaProvider key="safe-area-provider">{otherChildren}</SafeAreaProvider>
  );
  if (content && !disableHorizontalSafeAreaInsets) {
    // The provider is inside the SafeAreaView, so `useSafeAreaInsets` does not report the applied horizontal insets again.
    content = (
      <SafeAreaView key="safe-area-view" edges={{ left: true, right: true }}>
        {content}
      </SafeAreaView>
    );
  }
  return [
    ...nativeChildren,
    content,
    header && <SplitViewColumnHeader key="header" header={header} />,
  ];
}

/**
 * @platform iOS 26+
 */
export function SplitViewInspector({ children, header }: SplitViewColumnProps) {
  return (
    <Split.Inspector>
      {children}
      {header && <SplitViewColumnHeader header={header} />}
    </Split.Inspector>
  );
}
