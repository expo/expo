import {
  AnimatedVisibility,
  Column,
  EnterTransition,
  ExitTransition,
  Icon,
  ListItem,
  Text,
  useMaterialColors,
} from '@expo/ui/jetpack-compose';
import {
  animated,
  background,
  clickable,
  clip,
  graphicsLayer,
  padding,
  Shapes,
  spring,
} from '@expo/ui/jetpack-compose/modifiers';

import type { CollapsibleProps } from './types';

const KEYBOARD_ARROW_DOWN = require('../../../assets/keyboard_arrow_down.xml');

// M3 large-corner token (16dp) — the Expressive expandable-list-item pattern.
const CONTAINER_SHAPE = Shapes.RoundedCorner(16);

// expandVertically + fadeIn keeps motion strictly vertical.
// (Compose's default expandIn includes a horizontal component.)
const ENTER = EnterTransition.expandVertically().plus(EnterTransition.fadeIn());
const EXIT = ExitTransition.shrinkVertically().plus(ExitTransition.fadeOut());

/**
 * Android implementation of `Collapsible`.
 * A rounded M3 card whose container tint fades between `transparent` (collapsed) and `surfaceContainer` (expanded).
 */
export function Collapsible({ isOpen, onOpenChange, label = '', children }: CollapsibleProps) {
  const colors = useMaterialColors();
  const containerColor = isOpen ? colors.surfaceContainer : 'transparent';

  return (
    <Column
      modifiers={[
        // `clip` first so background paint and the inner ListItem's ripple both respect the rounded shape.
        clip(CONTAINER_SHAPE),
        background(containerColor, { animationSpec: spring() }),
      ]}>
      <ListItem
        // Transparent so the outer `background` is the sole tint source.
        colors={{ containerColor: 'transparent' }}
        modifiers={[clickable(() => onOpenChange(!isOpen))]}>
        <ListItem.HeadlineContent>
          <Text>{label}</Text>
        </ListItem.HeadlineContent>
        <ListItem.TrailingContent>
          <Icon
            source={KEYBOARD_ARROW_DOWN}
            modifiers={[graphicsLayer({ rotationZ: animated(isOpen ? 180 : 0, spring()) })]}
          />
        </ListItem.TrailingContent>
      </ListItem>
      <AnimatedVisibility visible={isOpen} enterTransition={ENTER} exitTransition={EXIT}>
        {/* 16dp matches the M3 large-corner radius.
            ListItem's own bottom padding adds the M3 header–body separation on top. */}
        <Column modifiers={[padding(16, 16, 16, 16)]}>{children}</Column>
      </AnimatedVisibility>
    </Column>
  );
}

export * from './types';
