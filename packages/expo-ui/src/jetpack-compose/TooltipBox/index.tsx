import { requireNativeView } from 'expo';
import { Platform } from 'react-native';

export type TooltipBoxProps = {
  /**
   * The component that the tooltip is anchored to.
   */
  children: React.ReactNode;
  /**
   * The text to display in the tooltip.
   */
  text: string;
};

const TooltipBoxNativeView: React.ComponentType<TooltipBoxProps> | null =
  Platform.OS === 'android' ? requireNativeView('ExpoUI', 'TooltipBox') : null;

/**
 * Use tooltips to add context to a button or other UI element.
 */
export function TooltipBox(props: TooltipBoxProps) {
  if (!TooltipBoxNativeView) {
    return null;
  }
  return <TooltipBoxNativeView {...props} />;
}
