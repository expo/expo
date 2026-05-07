import type { ImageRef } from 'expo-image';
import type { ReactNode } from 'react';
import type { ColorValue, ImageSourcePropType, StyleProp, TextStyle } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

import type { BasicTextStyle } from '../../../../utils/font';
import type { StackHeaderItemSharedProps } from '../shared';

export interface StackToolbarButtonProps {
  /**
   * Accessibility label spoken by screen readers (TalkBack/VoiceOver).
   *
   * @see [Android — Compose accessibility for graphic elements](https://developer.android.com/develop/ui/compose/accessibility/api-defaults#graphic-elements) and [Apple — Supporting VoiceOver in your app](https://developer.apple.com/documentation/uikit/supporting-voiceover-in-your-app#Update-your-apps-accessibility) for more information.
   *
   * @platform android
   * @platform ios
   */
  accessibilityLabel?: string;
  /**
   * @platform ios
   */
  accessibilityHint?: string;
  /**
   * There are two ways to specify the content of the button:
   *
   * @example
   * ```tsx
   * import { Stack } from 'expo-router';
   *
   * export default function Page() {
   *   return (
   *     <>
   *       <Stack.Toolbar placement="left">
   *         <Stack.Toolbar.Button icon="star.fill">As text passed as children</Stack.Toolbar.Button>
   *       </Stack.Toolbar>
   *       <ScreenContent />
   *     </>
   *   );
   * }
   * ```
   *
   * @example
   * ```tsx
   * import { Stack } from 'expo-router';
   *
   * export default function Page() {
   *   return (
   *     <>
   *       <Stack.Toolbar placement="left">
   *         <Stack.Toolbar.Button>
   *           <Stack.Toolbar.Icon sf="star.fill" />
   *           <Stack.Toolbar.Label>As components</Stack.Toolbar.Label>
   *           <Stack.Toolbar.Badge>3</Stack.Toolbar.Badge>
   *         </Stack.Toolbar.Button>
   *       </Stack.Toolbar>
   *       <ScreenContent />
   *     </>
   *   );
   * }
   * ```
   *
   * > **Note**: When icon is used, the label will not be shown and will be used for accessibility purposes only. Badge is only supported in left/right placements, not in bottom (iOS toolbar limitation).
   */
  children?: ReactNode;
  /**
   * @platform android
   * @platform ios
   */
  disabled?: boolean;
  /**
   * Whether the button should be hidden.
   *
   * @default false
   *
   * @platform android
   * @platform ios
   */
  hidden?: boolean;
  /**
   * Whether to hide the shared background.
   *
   * @platform iOS 26+
   */
  hidesSharedBackground?: boolean;
  /**
   * Icon to display in the button.
   *
   * On Android, only image source is supported.
   *
   * On iOS, it can be a string representing an SFSymbol, an image source or xcasset.
   *
   * > **Note**: When used in `placement="bottom"` on iOS, only string SFSymbols are supported. Use the `image` prop to provide custom images.
   *
   * @platform android
   * @platform ios
   */
  icon?: StackHeaderItemSharedProps['icon'];
  // TODO(@ubax): Add useImage support in a follow-up PR.
  /**
   * Image to display in the button.
   *
   * > **Note**: This prop is only supported in toolbar with `placement="bottom"`.
   *
   * @platform ios
   */
  image?: ImageRef;
  /**
   * Controls how image-based icons are rendered.
   *
   * - `'template'`: applies tint color to the icon
   * - `'original'`: preserves original icon colors (useful for multi-color icons)
   *
   * **Default behavior on iOS:**
   * - If `tintColor` is specified, defaults to `'template'`
   * - If no `tintColor`, defaults to `'original'`
   *
   * **On Android:** defaults to `'template'`.
   *
   * This prop only affects image-based icons (not SF Symbols).
   *
   * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uiimage/renderingmode-swift.enum) for more information.
   *
   * @platform android
   * @platform ios
   */
  iconRenderingMode?: 'template' | 'original';
  onPress?: () => void;
  /**
   * Whether to separate the background of this item from other header items.
   *
   * @default false
   * @platform ios
   */
  separateBackground?: boolean;
  /**
   * Whether the button is in a selected state
   *
   * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uibarbuttonitem/isselected) for more information
   *
   * @platform ios
   */
  selected?: boolean;
  /**
   * Style for the label of the header item.
   *
   * @platform android
   * @platform ios
   */
  style?: StyleProp<TextStyle>;
  /**
   * The tint color to apply to the button item.
   *
   * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uibarbuttonitem/tintcolor) for more information.
   * @see [Android documentation](https://developer.android.com/develop/ui/compose/graphics/images/customize#tint-image) for more information.
   *
   * @platform android
   * @platform ios
   */
  tintColor?: StackHeaderItemSharedProps['tintColor'];
  /**
   * @default 'plain'
   * @platform ios
   */
  variant?: StackHeaderItemSharedProps['variant'];
}

export interface NativeToolbarButtonProps {
  accessibilityLabel?: string;
  accessibilityHint?: string;
  disabled?: boolean;
  hidden?: boolean;
  hidesSharedBackground?: boolean;
  icon?: SFSymbol;
  xcassetName?: string;
  image?: ImageRef;
  imageRenderingMode?: 'template' | 'original';
  onPress?: () => void;
  possibleTitles?: string[];
  selected?: boolean;
  separateBackground?: boolean;
  style?: StyleProp<BasicTextStyle>;
  tintColor?: ColorValue;
  variant?: 'plain' | 'done' | 'prominent';
  label?: string;
  /* @platform android */
  source?: ImageSourcePropType;
}
