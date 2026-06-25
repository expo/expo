import { Button, HStack, RNHostView, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  background,
  buttonStyle,
  contentShape,
  foregroundStyle,
  shapes,
} from '@expo/ui/swift-ui/modifiers';
import { Children, isValidElement, type ReactNode } from 'react';

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

// A raw RN view (e.g. `<View style={{ width: 20, height: 20 }} />`) has no intrinsic size, so when
// embedded directly in the SwiftUI row it stretches to fill the available space instead of honoring
// its layout size. Wrap each accessory in `RNHostView matchContents` so SwiftUI pins it to the RN
// content's measured size. SwiftUI-native content (e.g. `Text`/`Image`) renders at its natural size.
function renderAccessory(node: ReactNode): ReactNode {
  const wrapped = wrapStrings(node);
  if (!isValidElement(wrapped)) return wrapped;
  return <RNHostView matchContents>{wrapped}</RNHostView>;
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
  } = props;
  const slots = extractListItemSlots(children);
  const leading = slots.leading ?? leadingProp;
  const trailing = slots.trailing ?? trailingProp;
  const supporting = slots.supporting ?? supportingText;

  return (
    <Button onPress={onPress} modifiers={[buttonStyle('plain')]} testID={testID}>
      <HStack spacing={12} modifiers={[contentShape(shapes.rectangle())]}>
        {renderAccessory(leading)}
        {/* <VStack alignment="leading" spacing={2}>
          <>{wrapStrings(slots.headline)}</>
          {supporting != null ? renderSupporting(supporting) : null}
        </VStack> */}
        <Spacer />
        {renderAccessory(trailing)}
      </HStack>
    </Button>
  );
}

export * from './types';
