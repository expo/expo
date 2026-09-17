import { requireNativeView } from 'expo';

import { Slot } from '../SlotView';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export interface ToolbarProps extends CommonViewModifierProps {
  /**
   * The view the toolbar belongs to, together with the `Toolbar.Content` that fills it.
   */
  children: React.ReactNode;
}

export interface ToolbarContentProps {
  /**
   * The items to place in the toolbar.
   */
  children: React.ReactNode;
}

const ToolbarNativeView: React.ComponentType<ToolbarProps> = requireNativeView(
  'ExpoUI',
  'ToolbarView'
);

/**
 * The items placed in the toolbar of the view `Toolbar` wraps.
 */
function ToolbarContent(props: ToolbarContentProps) {
  return <Slot name="content">{props.children}</Slot>;
}

/**
 * Adds a toolbar to the view it wraps, matching SwiftUI's `toolbar(content:)`.
 *
 * @example
 * ```tsx
 * <NavigationStack>
 *   <Toolbar>
 *     <Text>Bird description</Text>
 *     <Toolbar.Content>
 *       <Button role="close" onPress={() => setIsPresented(false)} />
 *     </Toolbar.Content>
 *   </Toolbar>
 * </NavigationStack>
 * ```
 *
 * @platform ios
 */
function ToolbarComponent(props: ToolbarProps) {
  const { modifiers, children, ...restProps } = props;
  return (
    <ToolbarNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}>
      {children}
    </ToolbarNativeView>
  );
}

const Toolbar = Object.assign(ToolbarComponent, { Content: ToolbarContent });

export { Toolbar };
