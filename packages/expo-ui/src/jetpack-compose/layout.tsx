import { requireNativeView } from 'expo';
import { Platform } from 'react-native';

import { ExpoModifier } from '../types';

export type PrimitiveBaseProps = {
  /**
   * Modifiers for the component.
   */
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
export type FloatingToolbarExitAlwaysScrollBehavior = 'top' | 'bottom' | 'start' | 'end';

type LayoutBaseProps = {
  children?: React.ReactNode;
  horizontalArrangement?: HorizontalArrangement;
  verticalArrangement?: VerticalArrangement;
  horizontalAlignment?: HorizontalAlignment;
  verticalAlignment?: VerticalAlignment;
  floatingToolbarExitAlwaysScrollBehavior?: FloatingToolbarExitAlwaysScrollBehavior;
  modifiers?: ExpoModifier[];
} & PrimitiveBaseProps;

//#region Box Component
export type BoxProps = Pick<
  LayoutBaseProps,
  'children' | 'modifiers' | 'floatingToolbarExitAlwaysScrollBehavior'
>;
const BoxNativeView: React.ComponentType<BoxProps> | null =
  Platform.OS === 'android' ? requireNativeView('ExpoUI', 'BoxView') : null;
export function Box(props: BoxProps) {
  if (!BoxNativeView) {
    return null;
  }
  return (
    <BoxNativeView
      {...props}
      // @ts-ignore
      modifiers={props.modifiers?.map((m) => m.__expo_shared_object_id__)}
    />
  );
}
//#endregion

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
