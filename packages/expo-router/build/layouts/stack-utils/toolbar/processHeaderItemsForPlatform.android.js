"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.processHeaderItemsForPlatform = processHeaderItemsForPlatform;
const jetpack_compose_1 = require("@expo/ui/jetpack-compose");
const context_1 = require("./context");
const NativeMenuContext_1 = require("../../../link/NativeMenuContext");
/**
 * On Android, renders toolbar children as native Compose components inside `headerLeft`/`headerRight`.
 * This bridges the gap since Android's react-native-screens doesn't support
 * `unstable_headerLeftItems`/`unstable_headerRightItems`.
 */
function processHeaderItemsForPlatform(children, placement) {
    if (placement !== 'left' && placement !== 'right') {
        return null;
    }
    const headerContent = () => {
        return <HeaderToolbarHostBase placement={placement}>{children}</HeaderToolbarHostBase>;
    };
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
function HeaderToolbarHostBase({ children, placement, }) {
    return (<context_1.ToolbarPlacementContext.Provider value={placement}>
      <NativeMenuContext_1.NativeMenuContext value>
        <jetpack_compose_1.Host matchContents>
          <jetpack_compose_1.Row verticalAlignment="center">{children}</jetpack_compose_1.Row>
        </jetpack_compose_1.Host>
      </NativeMenuContext_1.NativeMenuContext>
    </context_1.ToolbarPlacementContext.Provider>);
}
//# sourceMappingURL=processHeaderItemsForPlatform.android.js.map