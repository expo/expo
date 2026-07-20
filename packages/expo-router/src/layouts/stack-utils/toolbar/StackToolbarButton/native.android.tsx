'use client';
import { Icon, IconButton } from '@expo/ui/jetpack-compose';

import { AnimatedItemContainer } from '../../../../toolbar/AnimatedItemContainer';
import { getBadgeContentDescription, ToolbarItemBadge } from '../ToolbarItemBadge';
import { useToolbarColors } from '../context';
import { DEFAULT_TOOLBAR_TINT_COLOR } from '../defaults';
import type { NativeToolbarButtonProps } from './types';

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

  // `tint={null}` tells `<Icon>` to draw the source in its original colors.
  // `undefined` would fall back to `LocalContentColor`, i.e. the IconButton's
  // content color, which is still a tint.
  const tintColor =
    props.imageRenderingMode === 'original'
      ? null
      : (props.tintColor ?? toolbarColors.tintColor ?? DEFAULT_TOOLBAR_TINT_COLOR());

  const button = (
    <IconButton onClick={props.onPress} enabled={!props.disabled}>
      <Icon
        source={props.source}
        tint={tintColor}
        size={24}
        contentDescription={getBadgeContentDescription(props.accessibilityLabel, props.badge)}
      />
    </IconButton>
  );

  return (
    <AnimatedItemContainer visible={!props.hidden}>
      <ToolbarItemBadge badge={props.badge} disabled={props.disabled}>
        {button}
      </ToolbarItemBadge>
    </AnimatedItemContainer>
  );
};
