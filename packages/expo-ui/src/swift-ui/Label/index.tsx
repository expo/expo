import { requireNativeView } from 'expo';
import { StyleProp, ViewStyle } from 'react-native';

import { Host } from '../Host';

export type LabelProps = {
  /**
   * The title text to be displayed in the label.
   */
  title?: string;

  /**
   * The name of the SFSymbol to be displayed in the label.
   */
  systemImage?: string;

  /**
   * The color of the label icon.
   */
  color?: string;
};

const LabelNativeView: React.ComponentType<LabelProps> = requireNativeView('ExpoUI', 'LabelView');

/**
 * `<Label>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
export function LabelPrimitive(props: LabelProps) {
  return <LabelNativeView {...props} />;
}

/**
 * Renders a native label view, which could be used in a list or section.
 *
 * @param {LabelProps} props - The properties passed to the Label component.
 * @returns {JSX.Element} The rendered native Label component.
 * @platform ios
 */
export function Label(props: LabelProps & { style?: StyleProp<ViewStyle> }) {
  return (
    <Host style={props.style} matchContents>
      <LabelPrimitive {...props} />
    </Host>
  );
}
