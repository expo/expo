import { requireNativeView } from 'expo';
import { ColorValue, Platform, StyleProp, ViewStyle } from 'react-native';

type PrimitiveBaseProps = {
  /**
   * Used to locate this view in end-to-end tests.
   */
  testID?: string;
};

export type HorizontalArrangement =
  | 'start'
  | 'end'
  | 'center'
  | 'spaceBetween'
  | 'spaceAround'
  | 'spaceEvenly';
export type VerticalArrangement =
  | 'top'
  | 'bottom'
  | 'center'
  | 'spaceBetween'
  | 'spaceAround'
  | 'spaceEvenly';
export type HorizontalAlignment = 'start' | 'end' | 'center';
export type VerticalAlignment = 'top' | 'bottom' | 'center';

type LayoutBaseProps = {
  children?: React.ReactNode;
  horizontalArrangement?: HorizontalArrangement;
  verticalArrangement?: VerticalArrangement;
  horizontalAlignment?: HorizontalAlignment;
  verticalAlignment?: VerticalAlignment;
} & PrimitiveBaseProps;

//#region Row Component
export type RowProps = LayoutBaseProps;
const RowNativeView: React.ComponentType<RowProps> | null =
  Platform.OS === 'android' ? requireNativeView('ExpoUI', 'RowView') : null;
export function Row(props: RowProps) {
  if (!RowNativeView) {
    return null;
  }
  return <RowNativeView {...props} />;
}
//#endregion

//#region Column Component
export type ColumnProps = LayoutBaseProps;
const ColumnNativeView: React.ComponentType<ColumnProps> | null =
  Platform.OS === 'android' ? requireNativeView('ExpoUI', 'ColumnView') : null;
export function Column(props: ColumnProps) {
  if (!ColumnNativeView) {
    return null;
  }
  return <ColumnNativeView {...props} />;
}
//#endregion

//#region Container Component
export type ContainerProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
} & PrimitiveBaseProps;
const ContainerNativeView: React.ComponentType<ColumnProps> | null =
  Platform.OS === 'android' ? requireNativeView('ExpoUI', 'ContainerView') : null;
export function Container(props: ContainerProps) {
  if (!ContainerNativeView) {
    return null;
  }
  return <ContainerNativeView {...props} />;
}
//#endregion

//#region Text Component

export type TextFontWeight =
  | 'normal'
  | 'bold'
  | '100'
  | '200'
  | '300'
  | '400'
  | '500'
  | '600'
  | '700'
  | '800'
  | '900';

export type TextProps = {
  children: string;
  color?: ColorValue;
  fontSize?: number;
  fontWeight?: TextFontWeight;
} & PrimitiveBaseProps;

const TextNativeView: React.ComponentType<Omit<TextProps, 'children'> & { text: string }> | null =
  Platform.OS === 'android' ? requireNativeView('ExpoUI', 'TextView') : null;
type NativeTextProps = Omit<TextProps, 'children'> & {
  text: string;
};
function transformTextProps(props: TextProps): NativeTextProps {
  const { children, ...restProps } = props;
  return {
    ...restProps,
    text: children ?? '',
  };
}
export function Text(props: TextProps) {
  if (!TextNativeView) {
    return null;
  }
  return <TextNativeView {...transformTextProps(props)} />;
}
//#endregion
