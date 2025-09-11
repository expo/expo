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
    onDeleteItem: ({ nativeEvent: { index } }) => props?.onDeleteItem?.(index),
    onMoveItem: ({ nativeEvent: { from, to } }) => props?.onMoveItem?.(from, to),
    onSelectionChange: ({ nativeEvent: { selection } }) => props?.onSelectionChange?.(selection),
  };
}

export type ListStyle = 'automatic' | 'plain' | 'inset' | 'insetGrouped' | 'grouped' | 'sidebar';

export interface ListProps extends CommonViewModifierProps {
  /**
   * One of the predefined ListStyle types in SwiftUI.
   * @default 'automatic'
   */
  listStyle?: ListStyle;

  /**
   * Allows the selection of list items.
   * @default false
   */
  selectEnabled?: boolean;

  /**
   * Enables reordering of list items.
   * @default false
   */
  moveEnabled?: boolean;

  /**
   * Allows the deletion of list items.
   * @default false
   */
  deleteEnabled?: boolean;

  /**
   * Makes the list scrollable.
   * @default true
   * @platform ios 16.0+
   */
  scrollEnabled?: boolean;

  /**
   * Enables SwiftUI edit mode.
   * @default false
   */
  editModeEnabled?: boolean;

  /**
   * The children elements to be rendered inside the list.
   */
  children: React.ReactNode;

  /**
   * Callback triggered when an item is deleted from the list.
   */
  onDeleteItem?: (index: number) => void;

  /**
   * Callback triggered when an item is moved in the list.
   */
  onMoveItem?: (from: number, to: number) => void;

  /**
   * Callback triggered when the selection changes in a list.
   */
  onSelectionChange?: (selection: number[]) => void;
}

/**
 * DeleteItemEvent represents an event triggered when an item is deleted from the list.
 */
type DeleteItemEvent = ViewEvent<'onDeleteItem', { index: number }>;
/**
 * MoveItemEvent represents an event triggered when an item is moved in the list.
 */
type MoveItemEvent = ViewEvent<'onMoveItem', { from: number; to: number }>;
/**
 * SelectItemEvent represents an event triggered when the selection changes in a list.
 */
type SelectItemEvent = ViewEvent<'onSelectionChange', { selection: number[] }>;

type NativeListProps = Omit<ListProps, 'onDeleteItem' | 'onMoveItem' | 'onSelectionChange'> &
  DeleteItemEvent &
  MoveItemEvent &
  SelectItemEvent & {
    children: React.ReactNode;
  };

/**
 * A list component that renders its children using a native SwiftUI list.
 * @param {ListProps} props - The properties for the list component.
 * @returns {JSX.Element | null} The rendered list with its children or null if the platform is unsupported.
 * @platform ios
 */
export function List(props: ListProps) {
  const { children, ...nativeProps } = props;
  return <ListNativeView {...transformListProps(nativeProps)}>{children}</ListNativeView>;
}
