'use client';
import { Box } from '@expo/ui/jetpack-compose';
import { width } from '@expo/ui/jetpack-compose/modifiers';

import type { NativeToolbarSpacerProps } from './types';
import { AnimatedItemContainer } from '../../../../toolbar/AnimatedItemContainer';

/**
 * Native toolbar spacer component for Android bottom toolbar.
 * Only supports fixed-width spacers
 */
export const NativeToolbarSpacer: React.FC<NativeToolbarSpacerProps> = (props) => {
  if (!props.width) {
    return null;
  }

  return (
    <AnimatedItemContainer visible={!props.hidden}>
      <Box modifiers={[width(props.width)]} />
    </AnimatedItemContainer>
  );
};
