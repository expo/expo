import { requireNativeView } from 'expo';
import { type ColorSchemeName, StyleProp, ViewStyle } from 'react-native';

import { PrimitiveBaseProps } from '../layout';

//#region Host Component
export type HostProps = {
  /**
   * When true, the host view will update its size in the React Native view tree to match the content's layout from Jetpack Compose.
   * Can be only set once on mount.
   * @default false
   */
  matchContents?: boolean | { vertical?: boolean; horizontal?: boolean };

  /**
   * Callback function that is triggered when the Jetpack Compose content completes its layout.
   * Provides the current dimensions of the content, which may change as the content updates.
   */
  onLayoutContent?: (event: { nativeEvent: { width: number; height: number } }) => void;

  /**
   * The color scheme of the host view.
   */
  colorScheme?: ColorSchemeName;

  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
} & PrimitiveBaseProps;

const HostNativeView: React.ComponentType<
  HostProps & { matchContentsVertical?: boolean; matchContentsHorizontal?: boolean }
> = requireNativeView('ExpoUI', 'HostView');

export function Host(props: HostProps) {
  const { matchContents, modifiers, onLayoutContent, ...restProps } = props;
  return (
    <HostNativeView
      {...restProps}
      // @ts-expect-error
      modifiers={modifiers?.map((m) => m.__expo_shared_object_id__)}
      matchContentsVertical={
        typeof matchContents === 'object' ? matchContents.vertical : matchContents
      }
      matchContentsHorizontal={
        typeof matchContents === 'object' ? matchContents.horizontal : matchContents
      }
      onLayoutContent={onLayoutContent}
    />
  );
}
//#endregion
