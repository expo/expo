import { ListItem as ComposeListItem, Text } from '@expo/ui/jetpack-compose';
import { clickable } from '@expo/ui/jetpack-compose/modifiers';
import { Children, type ReactNode } from 'react';

import { extractListItemSlots } from './ListItemSlots';
import type { ListItemProps } from './types';

// Compose hosts can't render raw strings — they need a `Text` composable.
// Wrap any string/number node so consumers can pass plain strings via shorthand props or compound children.
function wrapStrings(node: ReactNode): ReactNode {
  if (node == null || typeof node === 'boolean') return node;
  if (typeof node === 'string' || typeof node === 'number') return <Text>{node}</Text>;
  if (Array.isArray(node)) return Children.map(node, wrapStrings);
  return node;
}

/**
 * Android implementation of `ListItem`.
 * Delegates to Material 3 `ListItem` and applies `clickable` for tap handling.
 */
export function ListItem(props: ListItemProps) {
  const {
    children,
    onPress,
    leading: leadingProp,
    trailing: trailingProp,
    supportingText,
    modifiers,
  } = props;
  const slots = extractListItemSlots(children);
  const leading = slots.leading ?? leadingProp;
  const trailing = slots.trailing ?? trailingProp;
  const supporting = slots.supporting ?? supportingText;
  const itemModifiers = [...(onPress ? [clickable(onPress)] : []), ...(modifiers ?? [])];

  return (
    <ComposeListItem modifiers={itemModifiers.length ? itemModifiers : undefined}>
      <ComposeListItem.HeadlineContent>
        <>{wrapStrings(slots.headline)}</>
      </ComposeListItem.HeadlineContent>
      {supporting != null ? (
        <ComposeListItem.SupportingContent>
          {typeof supporting === 'string' || typeof supporting === 'number' ? (
            <Text>{supporting}</Text>
          ) : (
            supporting
          )}
        </ComposeListItem.SupportingContent>
      ) : null}
      {leading != null ? (
        <ComposeListItem.LeadingContent>{wrapStrings(leading)}</ComposeListItem.LeadingContent>
      ) : null}
      {trailing != null ? (
        <ComposeListItem.TrailingContent>{wrapStrings(trailing)}</ComposeListItem.TrailingContent>
      ) : null}
    </ComposeListItem>
  );
}

export * from './types';
