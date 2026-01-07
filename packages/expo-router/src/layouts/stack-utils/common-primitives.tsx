import { type ImageSourcePropType, type StyleProp, type TextStyle } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

import { Badge, Icon, Label } from '../../primitives';

export interface StackHeaderLabelProps {
  /**
   * The text to display as the label for the tab.
   */
  children?: string;
}

export const StackHeaderLabel: React.FC<StackHeaderLabelProps> = Label;

export type StackHeaderIconProps =
  | {
      // TODO: add support for vector icons
      src: ImageSourcePropType;
    }
  | {
      sf: SFSymbol;
    };

export const StackHeaderIcon: React.FC<StackHeaderIconProps> = Icon;

export interface StackHeaderBadgeProps {
  /**
   * The text to display as the badge
   */
  children?: string;

  style?: StyleProp<
    Pick<TextStyle, 'fontFamily' | 'fontSize' | 'color' | 'fontWeight' | 'backgroundColor'>
  >;
}

export const StackHeaderBadge: React.FC<StackHeaderBadgeProps> = Badge;
