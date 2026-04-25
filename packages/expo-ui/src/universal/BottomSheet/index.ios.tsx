import { BottomSheet as SwiftUIBottomSheet, Group } from '@expo/ui/swift-ui';
import { frame, padding, presentationDragIndicator } from '@expo/ui/swift-ui/modifiers';

import type { BottomSheetProps } from './types';

export function BottomSheet({
  children,
  isPresented,
  onDismiss,
  showDragIndicator = true,
  testID,
  modifiers,
}: BottomSheetProps) {
  return (
    <SwiftUIBottomSheet
      isPresented={isPresented}
      onIsPresentedChange={(presented) => {
        if (!presented) onDismiss();
      }}
      fitToContents
      testID={testID}>
      <Group
        modifiers={[
          frame({ maxWidth: Infinity, alignment: 'topLeading' }),
          padding({ top: 16, leading: 16, trailing: 16 }),
          presentationDragIndicator(showDragIndicator ? 'visible' : 'hidden'),
          ...(modifiers ?? []),
        ]}>
        {children}
      </Group>
    </SwiftUIBottomSheet>
  );
}

export * from './types';
