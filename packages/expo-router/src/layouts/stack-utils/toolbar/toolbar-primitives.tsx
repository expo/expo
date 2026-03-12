import type { AndroidSymbol } from 'expo-symbols';
import { type ImageSourcePropType, type StyleProp, type TextStyle } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

import { Badge, Icon, Label } from '../../../primitives';

export interface StackToolbarLabelProps {
  /**
   * The text to display as the label for the tab.
   */
  children?: string;
}

export const StackToolbarLabel: React.FC<StackToolbarLabelProps> = Label;

export type StackToolbarIconProps =
  | {
      // TODO: add support for vector icons
      src: ImageSourcePropType;
      /**
       * Controls how the image icon is rendered on iOS.
       *
       * - `'template'`: iOS applies tint color to the icon
       * - `'original'`: Preserves original icon colors
       *
       * Defaults based on parent component's `tintColor`:
       * - With `tintColor`: defaults to `'template'`
       * - Without `tintColor`: defaults to `'original'`
       *
       * @platform ios
       */
      renderingMode?: 'template' | 'original';
    }
  | {
      sf: SFSymbol;
    }
  | {
      /**
       * Name of an image in your Xcode asset catalog (`.xcassets`).
       *
       * @platform ios
       */
      xcasset: string;
      /**
       * Controls how the xcasset icon is rendered on iOS.
       *
       * - `'template'`: iOS applies tint color to the icon
       * - `'original'`: Preserves original icon colors
       *
       * Defaults based on parent component's `tintColor`:
       * - With `tintColor`: defaults to `'template'`
       * - Without `tintColor`: defaults to `'original'`
       *
       * @platform ios
       */
      renderingMode?: 'template' | 'original';
    }
  | {
      /**
       * Material Design icon name for Android. See the [Material icons catalog](https://fonts.google.com/icons).
       *
       * @platform android
       */
      md: AndroidSymbol;
    }
  | {
      /**
       * Material Design icon name for Android. See the [Material icons catalog](https://fonts.google.com/icons).
       *
       * @platform android
       */
      md: AndroidSymbol;
      /**
       * SF Symbol name for iOS.
       *
       * @platform ios
       */
      sf: SFSymbol;
    }
  | {
      /**
       * Material Design icon name for Android. See the [Material icons catalog](https://fonts.google.com/icons).
       *
       * @platform android
       */
      md: AndroidSymbol;
      /**
       * Name of an image in your Xcode asset catalog (`.xcassets`).
       *
       * @platform ios
       */
      xcasset: string;
      /**
       * Controls how the xcasset icon is rendered on iOS.
       *
       * @platform ios
       */
      renderingMode?: 'template' | 'original';
    }
  | {
      /**
       * Material Design icon name for Android. See the [Material icons catalog](https://fonts.google.com/icons).
       *
       * @platform android
       */
      md: AndroidSymbol;
      /**
       * Fallback image source for platforms that don't support Material icons.
       */
      src: ImageSourcePropType;
      /**
       * Controls how the image icon is rendered on iOS.
       *
       * @platform ios
       */
      renderingMode?: 'template' | 'original';
    };

export const StackToolbarIcon: React.FC<StackToolbarIconProps> = Icon;

export interface StackToolbarBadgeProps {
  /**
   * The text to display as the badge
   */
  children?: string;

  style?: StyleProp<
    Pick<TextStyle, 'fontFamily' | 'fontSize' | 'color' | 'fontWeight' | 'backgroundColor'>
  >;
}

export const StackToolbarBadge: React.FC<StackToolbarBadgeProps> = Badge;
