import type { ImageRef } from 'expo-image';
import type { ColorValue } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

import type { BasicTextStyle } from '../utils/font';

export interface RouterToolbarHostProps {
  children?: React.ReactNode;
}

export interface RouterToolbarItemProps {
  children?: React.ReactNode;
  identifier: string;
  title?: string;
  systemImageName?: SFSymbol;
  /**
   * Custom image loaded using expo-image's `useImage` hook.
   * Takes priority over `systemImageName` when both are provided.
   *
   * @example
   * ```tsx
   * const customIcon = useImage('https://example.com/icon.png', {
   *   maxWidth: 44,
   *   maxHeight: 44,
   * });
   *
   * <Toolbar.Item image={customIcon} title="Custom" />
   * ```
   */
  image?: ImageRef | null;
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
  } & BasicTextStyle;
  titleStyle?: BasicTextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  disabled?: boolean;
  onSelected?: () => void;
}
