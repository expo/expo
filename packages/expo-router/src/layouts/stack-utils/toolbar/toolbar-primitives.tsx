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
       * The rendering mode is controlled by the asset catalog's "Render As" setting.
       *
       * @platform ios
       */
      xcasset: string;
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
