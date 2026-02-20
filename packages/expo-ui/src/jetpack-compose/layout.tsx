import { requireNativeView } from 'expo';

import { ExpoModifier } from '../types';
import { createViewModifierEventListener } from './modifiers/utils';

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
  | 'spaceEvenly'
  | { spacedBy: number };
export type VerticalArrangement =
  | 'top'
  | 'bottom'
  | 'center'
  | 'spaceBetween'
  | 'spaceAround'
  | 'spaceEvenly'
  | { spacedBy: number };
export type HorizontalAlignment = 'start' | 'end' | 'center';
export type VerticalAlignment = 'top' | 'bottom' | 'center';
export type ContentAlignment =
  | 'topStart'
  | 'topCenter'
  | 'topEnd'
  | 'centerStart'
  | 'center'
  | 'centerEnd'
  | 'bottomStart'
  | 'bottomCenter'
  | 'bottomEnd';
export type FloatingToolbarExitAlwaysScrollBehavior = 'top' | 'bottom' | 'start' | 'end';

type LayoutBaseProps = {
  children?: React.ReactNode;
  horizontalArrangement?: HorizontalArrangement;
  verticalArrangement?: VerticalArrangement;
  horizontalAlignment?: HorizontalAlignment;
  verticalAlignment?: VerticalAlignment;
  contentAlignment?: ContentAlignment;
  floatingToolbarExitAlwaysScrollBehavior?: FloatingToolbarExitAlwaysScrollBehavior;
  modifiers?: ExpoModifier[];
} & PrimitiveBaseProps;

function transformProps(props: LayoutBaseProps) {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
  };
}

//#region Box Component
export type BoxProps = Pick<
  LayoutBaseProps,
  'children' | 'modifiers' | 'contentAlignment' | 'floatingToolbarExitAlwaysScrollBehavior'
>;
const BoxNativeView: React.ComponentType<BoxProps> = requireNativeView('ExpoUI', 'BoxView');

export function Box(props: BoxProps) {
  return <BoxNativeView {...transformProps(props)} />;
}
//#endregion

//#region Row Component
export type RowProps = LayoutBaseProps;
const RowNativeView: React.ComponentType<RowProps> = requireNativeView('ExpoUI', 'RowView');
export function Row(props: RowProps) {
  return <RowNativeView {...transformProps(props)} />;
}
//#endregion

//#region FlowRow Component
export type FlowRowProps = Pick<
  LayoutBaseProps,
  'children' | 'modifiers' | 'horizontalArrangement' | 'verticalArrangement'
>;
const FlowRowNativeView: React.ComponentType<FlowRowProps> = requireNativeView(
  'ExpoUI',
  'FlowRowView'
);
export function FlowRow(props: FlowRowProps) {
  return <FlowRowNativeView {...transformProps(props)} />;
}
//#endregion

//#region Column Component
export type ColumnProps = LayoutBaseProps;
const ColumnNativeView: React.ComponentType<ColumnProps> = requireNativeView(
  'ExpoUI',
  'ColumnView'
);
export function Column(props: ColumnProps) {
  return <ColumnNativeView {...transformProps(props)} />;
}
//#endregion
