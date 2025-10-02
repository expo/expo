import { requireNativeView } from 'expo';
import { ColorValue, Platform, StyleProp, ViewStyle } from 'react-native';
import { ExpoModifier } from '../types';

type PrimitiveBaseProps = {
  /**
   * Used to locate this view in end-to-end tests.
   */
  testID?: string;
  /** Modifiers for the component */
  modifiers?: ExpoModifier[];
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
  return (
    <RowNativeView
      {...props}
      // @ts-expect-error
      modifiers={props.modifiers?.map((m) => m.__expo_shared_object_id__)}
    />
  );
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
  return (
    <ColumnNativeView
      {...props}
      // @ts-expect-error
      modifiers={props.modifiers?.map((m) => m.__expo_shared_object_id__)}
    />
  );
}
//#endregion

//#region Host Component
export type HostProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
} & PrimitiveBaseProps;
const HostNativeView: React.ComponentType<ColumnProps> | null =
  Platform.OS === 'android' ? requireNativeView('ExpoUI', 'HostView') : null;
export function Host(props: HostProps) {
  if (!HostNativeView) {
    return null;
  }
  return <HostNativeView {...props} />;
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
  return (
    <TextNativeView
      {...transformTextProps(props)}
      // @ts-expect-error
      modifiers={props.modifiers?.map((m) => m.__expo_shared_object_id__)}
    />
  );
}
//#endregion
