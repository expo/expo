'use client';
import { Box, RNHostView } from '@expo/ui/jetpack-compose';
import { fillMaxHeight } from '@expo/ui/jetpack-compose/modifiers';

import { AnimatedItemContainer } from '../../../../toolbar/AnimatedItemContainer';
import { useToolbarPlacement } from '../context';
import type { NativeToolbarViewProps } from './types';

const bottomPlacementModifiers = [fillMaxHeight()];

export const NativeToolbarView: React.FC<NativeToolbarViewProps> = ({ children, hidden }) => {
  const placement = useToolbarPlacement();
  const modifiers = placement === 'bottom' ? bottomPlacementModifiers : undefined;

  return (
    <Box contentAlignment="center" modifiers={modifiers}>
      <AnimatedItemContainer visible={!hidden}>
        <RNHostView matchContents>
          <>{children}</>
        </RNHostView>
      </AnimatedItemContainer>
    </Box>
  );
};
