import { requireNativeView } from 'expo';
import { Children, Fragment, isValidElement, ReactElement, ReactNode, useMemo } from 'react';
import { NativeSyntheticEvent } from 'react-native';

import { Button, ButtonProps, NativeButtonProps, transformButtonProps } from '../Button';

type SwipeActionNativeEvent = NativeSyntheticEvent<{ id: string }>;
type EventHandlerMap = Map<string, (event: SwipeActionNativeEvent) => void>;
type NativeSwipeActionProps = { id: string; props: NativeButtonProps };
type SwipeActionElement = ReactElement<ButtonProps>;

type SwipeAction = SwipeActionElement | React.ReactElement<{ children: SwipeActionElement[] }>;

export type ListItemProps = {
  /**
   * Actions which will appear when swiping from the leading edge
   */
  leadingActions?: SwipeAction;

  /**
   * Whether to activate the first action when user overshoots swipe from leading edge
   * @default true
   */
  allowsFullSwipeLeading?: boolean;

  /**
   * Actions which will appear when swiping from the trailing edge
   */
  trailingActions?: SwipeAction;

  /**
   * Whether to activate the first action when user overshoots swipe from trailing edge
   * @default true
   */
  allowsFullSwipeTrailing?: boolean;

  /**
   * Whether to hide trailing edge actions when list edit mode is active
   * @default true
   */
  hideTrailingActionsInEditMode?: boolean;

  children: React.ReactNode;
};

type ListItemNativeProps = Omit<ListItemProps, 'leadingActions' | 'trailingActions'> & {
  leadingActions?: NativeSwipeActionProps[];
  trailingActions?: NativeSwipeActionProps[];
  onActionPressed: (event: SwipeActionNativeEvent) => void;
};

const ListItemNativeView: React.ComponentType<ListItemNativeProps> = requireNativeView(
  'ExpoUI',
  'ListItemView'
);

/**
 * Provides a way to add swipe actions to List items
 *
 * @param {ListItemProps} props - The properties passed to the item.
 * @returns {JSX.Element} The rendered native component.
 * @platform ios
 */
export function ListItem({ leadingActions, trailingActions, children, ...props }: ListItemProps) {
  const eventHandlersMap = new Map<string, (event: NativeSyntheticEvent<any>) => void>();

  const processedLeadingActions = useMemo(
    () => transformSwipeActions(leadingActions, eventHandlersMap),
    [leadingActions]
  );
  const processedTrailingActions = useMemo(
    () => transformSwipeActions(trailingActions, eventHandlersMap),
    [trailingActions]
  );

  return (
    <ListItemNativeView
      {...props}
      leadingActions={processedLeadingActions}
      trailingActions={processedTrailingActions}
      onActionPressed={(ev) => eventHandlersMap.get(ev.nativeEvent.id)?.call(undefined, ev)}>
      {children}
    </ListItemNativeView>
  );
}

function isButtonElement(element: ReactElement<any>): element is SwipeActionElement {
  return element.type === Button;
}

function processSwipeAction(
  child: ReactNode,
  eventHandlersMap: EventHandlerMap
): NativeSwipeActionProps | null {
  const isValidChild = isValidElement(child);
  if (!isValidChild || !isButtonElement(child)) {
    console.warn('Unsupported button type in ListItem ', isValidChild ? child?.type : child);
    return null;
  }

  const uuid = expo.uuidv4();

  if (child.props.onPress) eventHandlersMap.set(uuid, child.props.onPress);

  return {
    id: uuid,
    props: transformButtonProps(child.props),
  };
}

function getChildren(node?: SwipeAction) {
  if (isValidElement(node) && node.type === Fragment) return Children.toArray(node.props.children);

  return Children.toArray(node);
}

export function transformSwipeActions(
  children: SwipeAction | undefined,
  eventHandlersMap: EventHandlerMap
): NativeSwipeActionProps[] {
  return getChildren(children)
    .map((child) => processSwipeAction(child, eventHandlersMap))
    .filter((el): el is NativeSwipeActionProps => el !== null);
}
