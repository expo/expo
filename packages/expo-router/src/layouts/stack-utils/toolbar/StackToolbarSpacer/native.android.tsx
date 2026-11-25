'use client';

import { requireExpoUI } from '../../../../optional-libraries/expo-ui';
import { AnimatedItemContainer } from '../../../../toolbar/AnimatedItemContainer';
import type { NativeToolbarSpacerProps } from './types';

/**
 * Native toolbar spacer component for Android bottom toolbar.
 * Only supports fixed-width spacers
 */
export const NativeToolbarSpacer: React.FC<NativeToolbarSpacerProps> = (props) => {
  if (!props.width) {
    return null;
  }
  const {
    expoUI: { Box },
    modifiers: { width },
  } = requireExpoUI(
    "Stack.Toolbar on Android requires '@expo/ui'. Install it with `npx expo install @expo/ui` and rebuild your app."
  );

  return (
    <AnimatedItemContainer visible={!props.hidden}>
      <Box modifiers={[width(props.width)]} />
    </AnimatedItemContainer>
  );
};
