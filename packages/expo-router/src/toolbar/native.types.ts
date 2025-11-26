import type { ColorValue } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

export interface RouterToolbarHostProps {
  children?: React.ReactNode;
}

export interface RouterToolbarItemProps {
  children?: React.ReactNode;
  identifier: string;
  title?: string;
  systemImageName?: SFSymbol;
  type?: 'normal' | 'fixedSpacer' | 'fluidSpacer';
  tintColor?: ColorValue;
  hidesSharedBackground?: boolean;
  sharesBackground?: boolean;
  barButtonItemStyle?: 'plain' | 'prominent';
  width?: number;
  hidden?: boolean;
  selected?: boolean;
  possibleTitles?: string[];
  // Right now this does not seem to work
  badgeConfiguration?: {
    value?: string;
    backgroundColor?: ColorValue;
    color?: ColorValue;
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string;
  };
  onSelected?: () => void;
}
