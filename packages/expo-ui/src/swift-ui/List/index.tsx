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
   * Enables SwiftUI edit mode.
   * @default false
   */
  editModeEnabled?: boolean;

  /**
   * The children elements to be rendered inside the list.
   */
  children: React.ReactNode;

  /**
   * Callback triggered when the selection changes in a list.
   */
  onSelectionChange?: (selection: number[]) => void;
}

/**
 * SelectItemEvent represents an event triggered when the selection changes in a list.
 */
type SelectItemEvent = ViewEvent<'onSelectionChange', { selection: number[] }>;

type NativeListProps = Omit<ListProps, 'onSelectionChange'> &
  SelectItemEvent & {
    children: React.ReactNode;
  };

/**
 * A list component that renders its children using a native SwiftUI list.
 * @param {ListProps} props - The properties for the list component.
 * @returns {JSX.Element | null} The rendered list with its children or null if the platform is unsupported.
 */
export function List(props: ListProps) {
  const { children, ...nativeProps } = props;
  return <ListNativeView {...transformListProps(nativeProps)}>{children}</ListNativeView>;
}
