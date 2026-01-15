import { requireNativeView } from 'expo';

import { type ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

const ListNativeView: React.ComponentType<NativeListProps> = requireNativeView<NativeListProps>(
  'ExpoUI',
  'ListView'
);

function transformListProps(props: Omit<ListProps, 'children'>): Omit<NativeListProps, 'children'> {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    onSelectionChange: ({ nativeEvent: { selection } }) => props?.onSelectionChange?.(selection),
  };
}

export interface ListProps extends CommonViewModifierProps {
  /**
   * The children elements to be rendered inside the list.
   */
  children: React.ReactNode;

  /**
   * Callback triggered when the selection changes in a list.
   * Returns an array of selected item tags.
   */
  onSelectionChange?: (selection: (string | number)[]) => void;
}

/**
 * SelectItemEvent represents an event triggered when the selection changes in a list.
 */
type SelectItemEvent = ViewEvent<'onSelectionChange', { selection: (string | number)[] }>;

type NativeListProps = Omit<ListProps, 'onSelectionChange'> &
  SelectItemEvent & {
    children: React.ReactNode;
  };

/**
 * A list component that renders its children using a native SwiftUI list.
 */
export function List(props: ListProps) {
  const { children, ...nativeProps } = props;
  return <ListNativeView {...transformListProps(nativeProps)}>{children}</ListNativeView>;
}
