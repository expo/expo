import { requireNativeView } from 'expo';
import { useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

export type HostProps = {
  /**
   * When true, the host view will update its size in the React Native view tree to match the content's layout from SwiftUI.
   * @default false
   */
  matchContents?: boolean;

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

  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

const HostNativeView: React.ComponentType<HostProps> = requireNativeView('ExpoUI', 'HostView');

/**
 * A hosting component for SwiftUI views.
 */
export function Host(props: HostProps) {
  const { matchContents, useViewportSizeMeasurement, onLayoutContent, style, ...restProps } = props;
  const [containerStyle, setContainerStyle] = useState<ViewStyle | null>(null);
  return (
    <HostNativeView
      onLayoutContent={(e) => {
        onLayoutContent?.(e);
        if (matchContents) {
          setContainerStyle({
            width: e.nativeEvent.width,
            height: e.nativeEvent.height,
          });
        }
      }}
      style={[style, containerStyle]}
      matchContents={matchContents}
      useViewportSizeMeasurement={useViewportSizeMeasurement}
      {...restProps}
    />
  );
}
