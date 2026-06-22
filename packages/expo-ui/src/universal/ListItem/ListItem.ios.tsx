import { Button, HStack, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { buttonStyle, contentShape, foregroundStyle, shapes } from '@expo/ui/swift-ui/modifiers';
import { Children, type ReactNode } from 'react';

import { omitUserOverridden } from '../modifierUtils';
import { extractListItemSlots } from './ListItemSlots';
import type { ListItemProps } from './types';

// Wrap raw strings/numbers in a SwiftUI `Text` — SwiftUI hosts can't render bare strings.
function wrapStrings(node: ReactNode): ReactNode {
  if (node == null || typeof node === 'boolean') return node;
  if (typeof node === 'string' || typeof node === 'number') return <Text>{node}</Text>;
  if (Array.isArray(node)) return Children.map(node, wrapStrings);
  return node;
}

function renderSupporting(node: ReactNode): ReactNode {
  if (typeof node === 'string' || typeof node === 'number') {
    return (
      <Text modifiers={[foregroundStyle({ type: 'color', color: 'secondaryLabel' })]}>{node}</Text>
    );
  }
  return node;
}

/**
 * iOS implementation of `ListItem`.
 * Wraps a plain SwiftUI `Button` and applies `contentShape(.rectangle())` so the full row rectangle registers taps, including the gap between slots.
 */
export function ListItem(props: ListItemProps) {
  const {
    children,
    onPress,
    leading: leadingProp,
    trailing: trailingProp,
    supportingText,
    testID,
    modifiers,
  } = props;
  const slots = extractListItemSlots(children);
  const leading = slots.leading ?? leadingProp;
  const trailing = slots.trailing ?? trailingProp;
  const supporting = slots.supporting ?? supportingText;

  const buttonModifiers = [
    ...omitUserOverridden([buttonStyle('plain')], modifiers),
    ...(modifiers ?? []),
  ];

  return (
    <Button onPress={onPress} modifiers={buttonModifiers} testID={testID}>
      <HStack alignment="center" spacing={12} modifiers={[contentShape(shapes.rectangle())]}>
        {wrapStrings(leading)}
        <VStack alignment="leading" spacing={2}>
          <>{wrapStrings(slots.headline)}</>
          {supporting != null ? renderSupporting(supporting) : null}
        </VStack>
        <Spacer />
        {wrapStrings(trailing)}
      </HStack>
    </Button>
  );
}

export * from './types';
