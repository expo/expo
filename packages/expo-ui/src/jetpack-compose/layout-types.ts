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

export function transformProps<T extends PrimitiveBaseProps>(props: T) {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
  };
}
