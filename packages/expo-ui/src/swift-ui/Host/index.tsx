import { requireNativeView } from 'expo';
import { StyleProp, ViewStyle, type ColorSchemeName } from 'react-native';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export type HostProps = {
  /**
   * When true, the host view will update its size in the React Native view tree to match the content's layout from SwiftUI.
   * Can be only set once on mount.
   * @default false
   */
  matchContents?: boolean | { vertical?: boolean; horizontal?: boolean };

  /**
   * When true and no explicit size is provided, the host will use the viewport size as the proposed size for SwiftUI layout.
   * This is particularly useful for SwiftUI views that need to fill their available space, such as `Form`.
   * @default false
   */
  useViewportSizeMeasurement?: boolean;

  /**
   * Callback function that is triggered when the SwiftUI content completes its layout.
   * Provides the current dimensions of the content, which may change as the content updates.
   */
  onLayoutContent?: (event: { nativeEvent: { width: number; height: number } }) => void;

  /**
   * The color scheme of the host view.
   */
  colorScheme?: ColorSchemeName;

  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
} & CommonViewModifierProps;

const HostNativeView: React.ComponentType<
  HostProps & { matchContentsVertical?: boolean; matchContentsHorizontal?: boolean }
> = requireNativeView('ExpoUI', 'HostView');

/**
 * A hosting component for SwiftUI views.
 */
export function Host(props: HostProps) {
  const { matchContents, onLayoutContent, modifiers, ...restProps } = props;

  return (
    <HostNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      matchContentsVertical={
        typeof matchContents === 'object' ? matchContents.vertical : matchContents
      }
      matchContentsHorizontal={
        typeof matchContents === 'object' ? matchContents.horizontal : matchContents
      }
      onLayoutContent={onLayoutContent}
      {...restProps}
    />
  );
}
