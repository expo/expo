import { requireNativeView } from 'expo';

import type { ExpoModifier } from '../../types';
import { type ContentPadding } from '../LazyColumn';
import { createViewModifierEventListener } from '../modifiers/utils';

export type LazyRowProps = {
  /**
   * The content to display inside the lazy row.
   */
  children?: React.ReactNode;
  /**
   * The horizontal arrangement of items.
   * Can be a preset string or an object with `spacedBy` to specify spacing in dp.
   */
  horizontalArrangement?:
    | 'start'
    | 'end'
    | 'center'
    | 'spaceBetween'
    | 'spaceAround'
    | 'spaceEvenly'
    | { spacedBy: number };
  /**
   * The vertical alignment of items.
   */
  verticalAlignment?: 'top' | 'bottom' | 'center';
  /**
   * Content padding in dp.
   */
  contentPadding?: ContentPadding;
  /**
   * Modifiers for the component.
   */
  modifiers?: ExpoModifier[];
};

type NativeLazyRowProps = LazyRowProps;
const LazyRowNativeView: React.ComponentType<NativeLazyRowProps> = requireNativeView(
  'ExpoUI',
  'LazyRowView'
);

function transformProps(props: LazyRowProps): NativeLazyRowProps {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
  };
}

/**
 * A lazy row component that efficiently displays a horizontally scrolling list.
 */
export function LazyRow(props: LazyRowProps) {
  return <LazyRowNativeView {...transformProps(props)} />;
}
