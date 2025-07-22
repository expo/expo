import { requireNativeView } from 'expo';
import { useState } from 'react';
import { StyleProp, ViewStyle, type ColorSchemeName } from 'react-native';

export type HostProps = {
  /**
   * When true, the host view will update its size in the React Native view tree to match the content's layout from SwiftUI.
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
};

const HostNativeView: React.ComponentType<HostProps> = requireNativeView('ExpoUI', 'HostView');

/**
 * A hosting component for SwiftUI views.
 */
export function Host(props: HostProps) {
  const { matchContents, onLayoutContent, style, ...restProps } = props;
  const [containerStyle, setContainerStyle] = useState<ViewStyle | null>(null);

  return (
    <HostNativeView
      style={[style, containerStyle]}
      onLayoutContent={(e) => {
        onLayoutContent?.(e);
        if (matchContents) {
          const matchVertical =
            typeof matchContents === 'object' ? matchContents.vertical : matchContents;
          const matchHorizontal =
            typeof matchContents === 'object' ? matchContents.horizontal : matchContents;
          const newContainerStyle: ViewStyle = {};
          if (matchVertical) {
            newContainerStyle.height = e.nativeEvent.height;
          }
          if (matchHorizontal) {
            newContainerStyle.width = e.nativeEvent.width;
          }
          setContainerStyle(newContainerStyle);
        }
      }}
      {...restProps}
    />
  );
}
