import { Column, ModalBottomSheet } from '@expo/ui/jetpack-compose';
import {
  fillMaxHeight,
  padding,
  testID as testIDModifier,
  type ModifierConfig,
} from '@expo/ui/jetpack-compose/modifiers';

import type { BottomSheetProps, SnapPoint } from './types';

// M3 `ModalBottomSheet` only has partial/expanded states.
// Only allow the partial state when the consumer requested a partial-friendly snap point.
function shouldSkipPartiallyExpanded(snapPoints: SnapPoint[] | undefined): boolean {
  if (!snapPoints || snapPoints.length === 0) return false;
  return !snapPoints.some(
    (sp) =>
      sp === 'half' ||
      (typeof sp === 'object' && 'fraction' in sp && sp.fraction < 1) ||
      (typeof sp === 'object' && 'height' in sp)
  );
}

// M3 sizes content to intrinsic height.
// Apply `fillMaxHeight` so `'full'` actually fills the viewport instead of stopping at content height.
function shouldFillMaxHeight(snapPoints: SnapPoint[] | undefined): boolean {
  if (!snapPoints || snapPoints.length === 0) return false;
  return snapPoints.some(
    (sp) => sp === 'full' || (typeof sp === 'object' && 'fraction' in sp && sp.fraction >= 1)
  );
}

export function BottomSheet({
  children,
  isPresented,
  onDismiss,
  showDragIndicator = true,
  snapPoints,
  testID,
  modifiers,
}: BottomSheetProps) {
  if (!isPresented) return null;

  const contentModifiers: ModifierConfig[] = [padding(16, showDragIndicator ? 0 : 16, 16, 0)];
  if (shouldFillMaxHeight(snapPoints)) contentModifiers.push(fillMaxHeight());
  if (testID) contentModifiers.push(testIDModifier(testID));

  return (
    <ModalBottomSheet
      onDismissRequest={onDismiss}
      showDragHandle={showDragIndicator}
      skipPartiallyExpanded={shouldSkipPartiallyExpanded(snapPoints)}
      modifiers={modifiers}>
      {/* When the drag handle is hidden, add top padding so content doesn't crop against the top edge of the sheet. */}
      <Column modifiers={contentModifiers}>{children}</Column>
    </ModalBottomSheet>
  );
}

export * from './types';
