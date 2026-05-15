import { requireNativeView } from 'expo';

import { type ModifierConfig } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

export type BadgedBoxProps = {
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
  /**
   * Children containing the main content and a `BadgedBox.Badge` slot.
   */
  children?: React.ReactNode;
};

type SlotProps = {
  slotName: string;
  children: React.ReactNode;
};

const BadgedBoxNativeView: React.ComponentType<BadgedBoxProps> = requireNativeView(
  'ExpoUI',
  'BadgedBoxView'
);

const SlotNativeView: React.ComponentType<SlotProps> = requireNativeView('ExpoUI', 'SlotView');

function transformProps(props: BadgedBoxProps): BadgedBoxProps {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
  };
}

/**
 * Slot for the badge overlay. Place a `Badge` component inside.
 */
function BadgeSlot(props: { children: React.ReactNode }) {
  return <SlotNativeView slotName="badge">{props.children}</SlotNativeView>;
}

/**
 * A badged box matching Compose's `BadgedBox`.
 * Overlays a badge on top of content (for example, an icon).
 *
 * @see [Jetpack Compose BadgedBox](https://developer.android.com/develop/ui/compose/components/badges)
 */
function BadgedBoxComponent(props: BadgedBoxProps) {
  const { children, ...restProps } = props;
  return <BadgedBoxNativeView {...transformProps(restProps)}>{children}</BadgedBoxNativeView>;
}

BadgedBoxComponent.Badge = BadgeSlot;

export { BadgedBoxComponent as BadgedBox };
