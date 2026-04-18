'use client';
import { useMemo } from 'react';
import { StackToolbarButton } from './StackToolbarButton';
import { StackToolbarMenu, StackToolbarMenuAction } from './StackToolbarMenu';
import { StackToolbarSearchBarSlot } from './StackToolbarSearchBarSlot';
import { StackToolbarSpacer } from './StackToolbarSpacer';
import { StackToolbarView } from './StackToolbarView';
import { ToolbarColorContext, ToolbarPlacementContext, useToolbarPlacement, } from './context';
import { processHeaderItemsForPlatform } from './processHeaderItemsForPlatform';
import { StackToolbarBadge, StackToolbarIcon, StackToolbarLabel } from './toolbar-primitives';
import { useCompositionOption } from '../../../fork/native-stack/composition-options';
import { NativeMenuContext } from '../../../link/NativeMenuContext';
import { RouterToolbarHost } from '../../../toolbar/native';
/**
 * The component used to configure the stack toolbar.
 *
 * - Use `placement="left"` to customize the left side of the header.
 * - Use `placement="right"` to customize the right side of the header.
 * - Use `placement="bottom"` (default) to show a bottom toolbar (iOS only).
 *
 * If multiple instances of this component are rendered for the same screen,
 * the last one rendered in the component tree takes precedence.
 *
 * > **Note:** Using `Stack.Toolbar` with `placement="left"` or `placement="right"` will
 * automatically make the header visible (`headerShown: true`), as the toolbar is rendered
 * as part of the native header.
 *
 * > **Note:** `Stack.Toolbar` with `placement="bottom"` can only be used inside **page**
 * components, not in layout components.
 *
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Layout() {
 *   return (
 *     <Stack>
 *       <Stack.Screen name="index">
 *         <Stack.Toolbar placement="left">
 *           <Stack.Toolbar.Button icon="sidebar.left" onPress={() => alert('Left button pressed!')} />
 *         </Stack.Toolbar>
 *         <Stack.Toolbar placement="right">
 *           <Stack.Toolbar.Button icon="ellipsis.circle" onPress={() => alert('Right button pressed!')} />
 *         </Stack.Toolbar>
 *       </Stack.Screen>
 *     </Stack>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.Toolbar placement="left">
 *         <Stack.Toolbar.Button icon="sidebar.left" onPress={() => alert('Left button pressed!')} />
 *       </Stack.Toolbar>
 *       <Stack.Toolbar>
 *         <Stack.Toolbar.Spacer />
 *         <Stack.Toolbar.Button icon="magnifyingglass" onPress={() => {}} />
 *         <Stack.Toolbar.Spacer />
 *       </Stack.Toolbar>
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * @experimental
 * @platform ios
 */
export const StackToolbar = (props) => {
    const parentPlacement = useToolbarPlacement();
    if (parentPlacement) {
        throw new Error(`Stack.Toolbar cannot be nested inside another Stack.Toolbar.`);
    }
    if (props.placement === 'bottom' || !props.placement) {
        return <StackToolbarBottom {...props}/>;
    }
    return <StackToolbarHeader {...props} key={props.placement}/>;
};
const StackToolbarBottom = ({ children, disableImePadding, tintColor, backgroundColor, }) => {
    const colors = useMemo(() => ({ tintColor, backgroundColor }), [tintColor, backgroundColor]);
    return (<ToolbarPlacementContext.Provider value="bottom">
      <ToolbarColorContext.Provider value={colors}>
        <NativeMenuContext value>
          <RouterToolbarHost withImePadding={!disableImePadding} backgroundColor={backgroundColor}>
            {children}
          </RouterToolbarHost>
        </NativeMenuContext>
      </ToolbarColorContext.Provider>
    </ToolbarPlacementContext.Provider>);
};
const StackToolbarHeader = ({ children, placement, asChild, disableImePadding, tintColor, backgroundColor, }) => {
    if (placement !== 'left' && placement !== 'right') {
        throw new Error(`Invalid placement "${placement}" for Stack.Toolbar. Expected "left" or "right".`);
    }
    const options = useMemo(() => appendStackToolbarPropsToOptions({}, 
    // satisfies ensures every prop is listed here
    {
        children,
        placement,
        asChild,
        disableImePadding,
        tintColor,
        backgroundColor,
    }), [children, placement, asChild, disableImePadding, tintColor, backgroundColor]);
    useCompositionOption(options);
    return null;
};
export function appendStackToolbarPropsToOptions(options, props) {
    const { children, placement = 'bottom', asChild } = props;
    if (placement === 'bottom') {
        // Bottom toolbar doesn't modify navigation options
        return options;
    }
    const colors = {
        tintColor: props.tintColor,
        backgroundColor: props.backgroundColor,
    };
    if (asChild) {
        const wrappedChildren = (<ToolbarColorContext.Provider value={colors}>{children}</ToolbarColorContext.Provider>);
        if (placement === 'left') {
            return {
                ...options,
                headerShown: true,
                headerLeft: () => wrappedChildren,
            };
        }
        else {
            return {
                ...options,
                headerShown: true,
                headerRight: () => wrappedChildren,
            };
        }
    }
    return { ...options, ...(processHeaderItemsForPlatform(children, placement, colors) ?? {}) };
}
StackToolbar.Button = StackToolbarButton;
StackToolbar.Menu = StackToolbarMenu;
StackToolbar.MenuAction = StackToolbarMenuAction;
StackToolbar.SearchBarSlot = StackToolbarSearchBarSlot;
StackToolbar.Spacer = StackToolbarSpacer;
StackToolbar.View = StackToolbarView;
StackToolbar.Label = StackToolbarLabel;
StackToolbar.Icon = StackToolbarIcon;
StackToolbar.Badge = StackToolbarBadge;
export default StackToolbar;
//# sourceMappingURL=StackToolbarClient.js.map