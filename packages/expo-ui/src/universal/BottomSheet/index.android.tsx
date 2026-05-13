import { Column, ModalBottomSheet } from '@expo/ui/jetpack-compose';
import {
  padding,
  testID as testIDModifier,
  type ModifierConfig,
} from '@expo/ui/jetpack-compose/modifiers';

import type { BottomSheetProps } from './types';

export function BottomSheet({
  children,
  isPresented,
  onDismiss,
  showDragIndicator = true,
  testID,
  modifiers,
}: BottomSheetProps) {
  if (!isPresented) return null;

  const contentModifiers: ModifierConfig[] = [padding(16, showDragIndicator ? 0 : 16, 16, 0)];
  if (testID) contentModifiers.push(testIDModifier(testID));

  return (
    <ModalBottomSheet
      onDismissRequest={onDismiss}
      showDragHandle={showDragIndicator}
      modifiers={modifiers}>
      {/* When the drag handle is hidden, add top padding so content doesn't
          crop against the top edge of the sheet. */}
      <Column modifiers={contentModifiers}>{children}</Column>
    </ModalBottomSheet>
  );
}

export * from './types';
