import { type ImageSourcePropType, type StyleProp, type TextStyle } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

import { Badge, Icon, Label } from '../../primitives';

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
    }
  | {
      sf: SFSymbol;
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
