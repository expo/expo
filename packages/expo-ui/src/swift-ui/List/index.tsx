import { requireNativeView } from 'expo';
import { type ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';
import { ListForEach } from './ListForEach';
export { ListForEach, type ListForEachProps, type ListForEachDataProps } from './ListForEach';
export interface ListProps extends CommonViewModifierProps {
  /**
   * The children elements to be rendered inside the list.
   */
  children: React.ReactNode;

  /**
   * The currently selected item tags.
   */
  selection?: (string | number)[];

  /**
   * Callback triggered when the selection changes in a list.
   * Returns an array of selected item tags.
   */
  onSelectionChange?: (selection: (string | number)[]) => void;
}

type NativeListProps = Omit<ListProps, 'onSelectionChange'> &
  ViewEvent<'onSelectionChange', { selection: (string | number)[] }>;
const ListNativeView = requireNativeView<NativeListProps>('ExpoUI', 'ListView');
/** A native SwiftUI List. Use List.ForEach's data form for windowed React rendering. */
export function List({ children, modifiers, onSelectionChange, ...props }: ListProps) {
  return (
    <ListNativeView
      {...props}
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      onSelectionChange={({ nativeEvent }) => onSelectionChange?.(nativeEvent.selection)}>
      {children}
    </ListNativeView>
  );
}
List.ForEach = ListForEach;
