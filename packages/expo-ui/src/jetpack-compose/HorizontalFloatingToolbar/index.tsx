import { requireNativeView } from 'expo';
import { Children } from 'react';

import { ExpoModifier } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

export type HorizontalFloatingToolbarProps = {
  /**
   * The variant of the horizontal floating toolbar.
   * @default 'standard'
   */
  variant?: 'standard' | 'vibrant';

  /**
   * The children of the component.
   */
  children: React.ReactNode;

  /**
   * Modifiers for the component.
   */
  modifiers?: ExpoModifier[];
};

export type FloatingActionButtonProps = {
  /**
   * A callback that is called when the button is pressed.
   */
  onPress?: () => void;

  /**
   * The children of the component.
   */
  children: React.ReactNode;
};

type NativeHorizontalFloatingToolbarProps = HorizontalFloatingToolbarProps & {};

type NativeSlotViewProps = {
  slotName: string;
  onSlotEvent?: () => void;
  children: React.ReactNode;
};

const HorizontalFloatingToolbarNativeView: React.ComponentType<NativeHorizontalFloatingToolbarProps> =
  requireNativeView('ExpoUI', 'HorizontalFloatingToolbarView');

// Internal slot marker component - not exported
const SlotNativeView: React.ComponentType<NativeSlotViewProps> = requireNativeView(
  'ExpoUI',
  'SlotView'
);

/**
 * FloatingActionButton component for HorizontalFloatingToolbar.
 * This component marks its children to be rendered in the FAB slot.
 */
export function HorizontalFloatingToolbarFloatingActionButton(props: FloatingActionButtonProps) {
  return <>{props.children}</>;
}
HorizontalFloatingToolbarFloatingActionButton.tag = 'FloatingActionButton';

function transformHorizontalFloatingToolbarProps(
  props: HorizontalFloatingToolbarProps
): NativeHorizontalFloatingToolbarProps {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
  };
}

/**
 * Renders a `HorizontalFloatingToolbar` component.
 * A horizontal toolbar that floats above content, typically used for action buttons.
 */
function HorizontalFloatingToolbar(props: HorizontalFloatingToolbarProps) {
  // Separate FloatingActionButton from regular children
  let floatingActionButtonContent: React.ReactNode = null;
  let floatingActionButtonOnPress: (() => void) | undefined = undefined;
  const regularChildren: React.ReactNode[] = [];

  Children.forEach(props.children as any, (child) => {
    if (child?.type?.tag === HorizontalFloatingToolbarFloatingActionButton.tag) {
      floatingActionButtonContent = child.props.children;
      floatingActionButtonOnPress = child.props.onPress;
    } else {
      regularChildren.push(child);
    }
  });

  return (
    <HorizontalFloatingToolbarNativeView {...transformHorizontalFloatingToolbarProps(props)}>
      {regularChildren}
      {floatingActionButtonContent && (
        <SlotNativeView slotName="floatingActionButton" onSlotEvent={floatingActionButtonOnPress}>
          {floatingActionButtonContent}
        </SlotNativeView>
      )}
    </HorizontalFloatingToolbarNativeView>
  );
}

HorizontalFloatingToolbar.FloatingActionButton = HorizontalFloatingToolbarFloatingActionButton;

export { HorizontalFloatingToolbar };
