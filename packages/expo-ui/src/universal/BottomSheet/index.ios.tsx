import { BottomSheet as SwiftUIBottomSheet, Group, Host } from '@expo/ui/swift-ui';
import {
  frame,
  padding,
  presentationDetents,
  presentationDragIndicator,
  type ModifierConfig,
  type PresentationDetent,
} from '@expo/ui/swift-ui/modifiers';

import type { BottomSheetProps, SnapPoint } from './types';

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
  ref,
}: BottomSheetProps) {
  const presentationModifiers: ModifierConfig[] = [
    frame({ maxWidth: Infinity, alignment: 'topLeading' }),
    padding({ top: 16, leading: 16, trailing: 16 }),
    presentationDragIndicator(showDragIndicator ? 'visible' : 'hidden'),
  ];
  if (snapPoints && snapPoints.length > 0) {
    presentationModifiers.push(presentationDetents(snapPoints.map(snapPointToDetent)));
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
        <Group modifiers={presentationModifiers} {...{ ref }}>
          {children}
        </Group>
      </SwiftUIBottomSheet>
    </Host>
  );
}

export * from './types';
