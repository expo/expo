import { requireNativeView } from 'expo';

export type TextProps = {
  children: string;
  /**
   * The font weight of the text.
   * Maps to iOS system font weights.
   */
  weight?:
    | 'ultraLight'
    | 'thin'
    | 'light'
    | 'regular'
    | 'medium'
    | 'semibold'
    | 'bold'
    | 'heavy'
    | 'black';
  /**
   * The font design of the text.
   * Maps to iOS system font designs.
   */
  design?: 'default' | 'rounded' | 'serif' | 'monospaced';
  /**
   * The font size of the text.
   */
  size?: number;
  /**
   * The line limit of the text.
   */
  lineLimit?: number;
};

type NativeTextProps = Omit<TextProps, 'children'> & {
  text: string;
};

const TextNativeView: React.ComponentType<Omit<TextProps, 'children'> & { text: string }> =
  requireNativeView('ExpoUI', 'TextView');

function transformTextProps(props: TextProps): NativeTextProps {
  const { children, ...restProps } = props;
  return {
    ...restProps,
    text: children ?? '',
  };
}

export function Text(props: TextProps) {
  return <TextNativeView {...transformTextProps(props)} />;
}
