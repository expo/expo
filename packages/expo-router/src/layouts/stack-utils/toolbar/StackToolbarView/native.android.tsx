'use client';

import { requireExpoUI } from '../../../../optional-libraries/expo-ui';
import { AnimatedItemContainer } from '../../../../toolbar/AnimatedItemContainer';
import { useToolbarPlacement } from '../context';
import type { NativeToolbarViewProps } from './types';

export const NativeToolbarView: React.FC<NativeToolbarViewProps> = ({ children, hidden }) => {
  const {
    expoUI: { Box, RNHostView },
    modifiers: { fillMaxHeight },
  } = requireExpoUI();
  const placement = useToolbarPlacement();
  const modifiers = placement === 'bottom' ? [fillMaxHeight()] : undefined;

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
