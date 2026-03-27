'use client';
import { IconButton, Icon } from '@expo/ui/jetpack-compose';

import type { NativeToolbarButtonProps } from './types';
import { AnimatedItemContainer } from '../../../../toolbar/AnimatedItemContainer';
import { useToolbarColors } from '../context';
import { DEFAULT_TOOLBAR_TINT_COLOR } from '../defaults';

/**
 * Native toolbar button component for Android bottom toolbar.
 * Renders as an IconButton with animated visibility.
 */
export const NativeToolbarButton: React.FC<NativeToolbarButtonProps> = (props) => {
  const toolbarColors = useToolbarColors();

  if (!props.source) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        'Stack.Toolbar.Button on Android requires an ImageSourcePropType icon. SF Symbols and xcasset icons are not supported. Use the `icon` prop with a require() or { uri } source, or use <Stack.Toolbar.Icon src={...} />.'
      );
    }
    return null;
  }

  const tintColor =
    props.imageRenderingMode === 'original'
      ? undefined
      : (props.tintColor ?? toolbarColors.tintColor ?? DEFAULT_TOOLBAR_TINT_COLOR());

  return (
    <AnimatedItemContainer visible={!props.hidden}>
      <IconButton onClick={props.onPress} enabled={!props.disabled}>
        <Icon source={props.source} tintColor={tintColor} size={24} />
      </IconButton>
    </AnimatedItemContainer>
  );
};
