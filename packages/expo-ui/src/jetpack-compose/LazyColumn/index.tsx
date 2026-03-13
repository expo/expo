import { requireNativeView } from 'expo';

import { ExpoModifier } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

/**
 * Content padding values for LazyColumn.
 */
export type ContentPadding = {
  /**
   * Start padding in dp.
   */
  start?: number;
  /**
   * Top padding in dp.
   */
  top?: number;
  /**
   * End padding in dp.
   */
  end?: number;
  /**
   * Bottom padding in dp.
   */
  bottom?: number;
};

export type LazyColumnProps = {
  /**
   * The content to display inside the lazy column.
   */
  children?: React.ReactNode;
  /**
   * The vertical arrangement of items.
   * Can be a preset string or an object with `spacedBy` to specify spacing in dp.
   */
  verticalArrangement?:
    | 'top'
    | 'bottom'
    | 'center'
    | 'spaceBetween'
    | 'spaceAround'
    | 'spaceEvenly'
    | { spacedBy: number };
  /**
   * The horizontal alignment of items.
   */
  horizontalAlignment?: 'start' | 'end' | 'center';
  /**
   * Content padding in dp.
   */
  contentPadding?: ContentPadding;
  /**
   * Modifiers for the component.
   */
  modifiers?: ExpoModifier[];
};

type NativeLazyColumnProps = LazyColumnProps;
const LazyColumnNativeView: React.ComponentType<NativeLazyColumnProps> = requireNativeView(
  'ExpoUI',
  'LazyColumnView'
);

function transformProps(props: LazyColumnProps): NativeLazyColumnProps {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
  };
}

/**
 * A lazy column component that efficiently displays a vertically scrolling list.
 */
export function LazyColumn(props: LazyColumnProps) {
  return <LazyColumnNativeView {...transformProps(props)} />;
}
