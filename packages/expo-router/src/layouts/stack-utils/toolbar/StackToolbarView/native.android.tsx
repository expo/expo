'use client';
import { Box, RNHostView } from '@expo/ui/jetpack-compose';
import { fillMaxHeight } from '@expo/ui/jetpack-compose/modifiers';

import type { NativeToolbarViewProps } from './types';
import { AnimatedItemContainer } from '../../../../toolbar/AnimatedItemContainer';

export const NativeToolbarView: React.FC<NativeToolbarViewProps> = ({ children, hidden }) => {
  return (
    <Box modifiers={[fillMaxHeight()]} contentAlignment="center">
      <AnimatedItemContainer visible={!hidden}>
        <RNHostView matchContents>
          <>{children}</>
        </RNHostView>
      </AnimatedItemContainer>
    </Box>
  );
};
