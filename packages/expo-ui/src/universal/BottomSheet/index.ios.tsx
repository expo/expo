import { BottomSheet as SwiftUIBottomSheet, Group, Host } from '@expo/ui/swift-ui';
import {
  frame,
  padding,
  presentationBackground,
  presentationDetents,
  presentationDragIndicator,
  type ModifierConfig,
  type PresentationDetent,
} from '@expo/ui/swift-ui/modifiers';

import type { BottomSheetProps, SnapPoint } from './types';
import { resolveContentPadding } from './utils';

function snapPointToDetent(snapPoint: SnapPoint): PresentationDetent {
  if (snapPoint === 'half') return 'medium';
  if (snapPoint === 'full') return 'large';
  return snapPoint;
}

export function BottomSheet({
  children,
  isPresented,
  onDismiss,
  showDragIndicator = true,
  snapPoints,
  testID,
  modifiers,
  contentPadding,
  containerColor,
}: BottomSheetProps) {
  const { top, bottom, left, right } = resolveContentPadding(contentPadding, {
    top: 16,
    bottom: 0,
    left: 16,
    right: 16,
  });
  const presentationModifiers: ModifierConfig[] = [
    frame({ maxWidth: Infinity, alignment: 'topLeading' }),
    padding({ top, bottom, leading: left, trailing: right }),
    presentationDragIndicator(showDragIndicator ? 'visible' : 'hidden'),
  ];
  if (snapPoints && snapPoints.length > 0) {
    presentationModifiers.push(presentationDetents(snapPoints.map(snapPointToDetent)));
  }
  if (containerColor) {
    presentationModifiers.push(presentationBackground(containerColor));
  }
  if (modifiers?.length) {
    presentationModifiers.push(...modifiers);
  }

  return (
    <Host style={{ position: 'absolute' }} pointerEvents="none">
      <SwiftUIBottomSheet
        isPresented={isPresented}
        onIsPresentedChange={(presented) => {
          if (!presented) onDismiss();
        }}
        fitToContents={!snapPoints || snapPoints.length === 0}
        testID={testID}>
        <Group modifiers={presentationModifiers}>{children}</Group>
      </SwiftUIBottomSheet>
    </Host>
  );
}

export * from './types';
