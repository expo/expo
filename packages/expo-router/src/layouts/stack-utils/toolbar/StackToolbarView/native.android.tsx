'use client';
import type { NativeToolbarViewProps } from './types';
import {
  getExpoUiJetpackCompose,
  getExpoUiJetpackComposeModifiers,
} from '../../../../optional-dependencies/expo-ui';
import { AnimatedItemContainer } from '../../../../toolbar/AnimatedItemContainer';
import { useToolbarPlacement } from '../context';

export const NativeToolbarView: React.FC<NativeToolbarViewProps> = ({ children, hidden }) => {
  const { Box, RNHostView } = getExpoUiJetpackCompose('`Stack.Toolbar.View` on Android');
  const { fillMaxHeight } = getExpoUiJetpackComposeModifiers('`Stack.Toolbar.View` on Android');
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
