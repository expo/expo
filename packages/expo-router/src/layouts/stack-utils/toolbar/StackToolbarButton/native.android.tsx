'use client';
import { Badge, Box, Icon, IconButton, Text as ComposeText } from '@expo/ui/jetpack-compose';

import type { NativeToolbarButtonProps } from './types';
import { AnimatedItemContainer } from '../../../../toolbar/AnimatedItemContainer';
import { convertFontWeightToComposeFontWeight } from '../../../../utils/font';
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

  // `tint={null}` tells `<Icon>` to draw the source in its original colors.
  // `undefined` would fall back to `LocalContentColor`, i.e. the IconButton's
  // content color, which is still a tint.
  const tintColor =
    props.imageRenderingMode === 'original'
      ? null
      : (props.tintColor ?? toolbarColors.tintColor ?? DEFAULT_TOOLBAR_TINT_COLOR());

  const iconElement = (
    <Icon
      source={props.source}
      tint={tintColor}
      size={24}
      contentDescription={props.accessibilityLabel}
    />
  );

  const button = (
    <IconButton onClick={props.onPress} enabled={!props.disabled}>
      {iconElement}
    </IconButton>
  );

  const hasBadge = props.badge?.value != null;

  return (
    <AnimatedItemContainer visible={!props.hidden}>
      {props.badge ? (
        <Box contentAlignment="topEnd">
          {button}
          <Badge
            containerColor={props.badge.style?.backgroundColor}
            contentColor={props.badge.style?.color}>
            {hasBadge ? (
              <ComposeText
                style={{
                  typography: 'labelSmall',
                  fontWeight: convertFontWeightToComposeFontWeight(props.badge.style?.fontWeight),
                  fontSize: props.badge.style?.fontSize,
                  fontFamily: props.badge.style?.fontFamily,
                }}>
                {String(props.badge.value)}
              </ComposeText>
            ) : null}
          </Badge>
        </Box>
      ) : (
        button
      )}
    </AnimatedItemContainer>
  );
};
