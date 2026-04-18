'use client';
import { Host, Row } from '@expo/ui/jetpack-compose';
import { useMemo } from 'react';
import { ToolbarColorContext, ToolbarPlacementContext, } from './context';
import { NativeMenuContext } from '../../../link/NativeMenuContext';
/**
 * On Android, renders toolbar children as native Compose components inside `headerLeft`/`headerRight`.
 * This bridges the gap since Android's react-native-screens doesn't support
 * `unstable_headerLeftItems`/`unstable_headerRightItems`.
 */
export function processHeaderItemsForPlatform(children, placement, colors) {
    if (placement !== 'left' && placement !== 'right') {
        return null;
    }
    const headerContent = (props) => (<HeaderToolbarHostBase placement={placement} colors={colors} headerProps={props}>
      {children}
    </HeaderToolbarHostBase>);
    if (placement === 'left') {
        return {
            headerShown: true,
            headerLeft: headerContent,
        };
    }
    return {
        headerShown: true,
        headerRight: headerContent,
    };
}
function HeaderToolbarHostBase({ children, placement, colors, headerProps, }) {
    const stableColors = useMemo(() => ({
        tintColor: colors?.tintColor ?? headerProps?.tintColor,
        backgroundColor: colors?.backgroundColor ?? headerProps?.backgroundColor,
    }), [
        colors?.backgroundColor,
        colors?.tintColor,
        headerProps?.tintColor,
        headerProps?.backgroundColor,
    ]);
    return (<ToolbarPlacementContext.Provider value={placement}>
      <ToolbarColorContext.Provider value={stableColors}>
        <NativeMenuContext value>
          <Host matchContents>
            <Row verticalAlignment="center">{children}</Row>
          </Host>
        </NativeMenuContext>
      </ToolbarColorContext.Provider>
    </ToolbarPlacementContext.Provider>);
}
//# sourceMappingURL=processHeaderItemsForPlatform.android.js.map