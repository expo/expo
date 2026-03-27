"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.processHeaderItemsForPlatform = processHeaderItemsForPlatform;
const jetpack_compose_1 = require("@expo/ui/jetpack-compose");
const react_1 = require("react");
const context_1 = require("./context");
const NativeMenuContext_1 = require("../../../link/NativeMenuContext");
/**
 * On Android, renders toolbar children as native Compose components inside `headerLeft`/`headerRight`.
 * This bridges the gap since Android's react-native-screens doesn't support
 * `unstable_headerLeftItems`/`unstable_headerRightItems`.
 */
function processHeaderItemsForPlatform(children, placement, colors) {
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
    const stableColors = (0, react_1.useMemo)(() => ({
        tintColor: colors?.tintColor ?? headerProps?.tintColor,
        backgroundColor: colors?.backgroundColor ?? headerProps?.backgroundColor,
    }), [
        colors?.backgroundColor,
        colors?.tintColor,
        headerProps?.tintColor,
        headerProps?.backgroundColor,
    ]);
    return (<context_1.ToolbarPlacementContext.Provider value={placement}>
      <context_1.ToolbarColorContext.Provider value={stableColors}>
        <NativeMenuContext_1.NativeMenuContext value>
          <jetpack_compose_1.Host matchContents>
            <jetpack_compose_1.Row verticalAlignment="center">{children}</jetpack_compose_1.Row>
          </jetpack_compose_1.Host>
        </NativeMenuContext_1.NativeMenuContext>
      </context_1.ToolbarColorContext.Provider>
    </context_1.ToolbarPlacementContext.Provider>);
}
//# sourceMappingURL=processHeaderItemsForPlatform.android.js.map