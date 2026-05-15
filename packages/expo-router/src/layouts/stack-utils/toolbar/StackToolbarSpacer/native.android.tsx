'use client';
import type { NativeToolbarSpacerProps } from './types';
import {
  getExpoUiJetpackCompose,
  getExpoUiJetpackComposeModifiers,
} from '../../../../optional-dependencies/expo-ui';
import { AnimatedItemContainer } from '../../../../toolbar/AnimatedItemContainer';

/**
 * Native toolbar spacer component for Android bottom toolbar.
 * Only supports fixed-width spacers
 */
export const NativeToolbarSpacer: React.FC<NativeToolbarSpacerProps> = (props) => {
  if (!props.width) {
    return null;
  }
  const { Box } = getExpoUiJetpackCompose('`Stack.Toolbar.Spacer` on Android');
  const { width } = getExpoUiJetpackComposeModifiers('`Stack.Toolbar.Spacer` on Android');

  return (
    <AnimatedItemContainer visible={!props.hidden}>
      <Box modifiers={[width(props.width)]} />
    </AnimatedItemContainer>
  );
};
