"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModalsRenderer = void 0;
const native_1 = require("@react-navigation/native");
const react_native_1 = require("react-native");
const ModalComponent_1 = require("./ModalComponent");
const utils_1 = require("./utils");
const ModalStackRouteDrawer_web_1 = require("./web/ModalStackRouteDrawer.web");
// TODO: think about better approach. This is transitive dependency from vaul
const react_portal_1 = require("@radix-ui/react-portal");
const ModalsRenderer = ({ children, modalConfigs, onDismissed, onShow, }) => {
    return (<div style={{ flex: 1, display: 'flex' }}>
      {children}
      {modalConfigs.map((config) => (<Modal key={config.uniqueId} config={config} onDismissed={() => onDismissed?.(config.uniqueId)}/>))}
    </div>);
};
exports.ModalsRenderer = ModalsRenderer;
function Modal({ config, onDismissed }) {
    const { colors } = (0, native_1.useTheme)();
    const presentation = (0, utils_1.getStackPresentationType)(config);
    if (presentation === 'transparentModal' || presentation === 'fullScreenModal') {
        return (<react_portal_1.Portal>
        <react_native_1.View style={react_native_1.StyleSheet.absoluteFill}>
          <react_native_1.View {...config.viewProps} style={[{ flex: 1, backgroundColor: colors.background }, config.viewProps?.style]}>
            <ModalComponent_1.ModalComponent modalConfig={config}/>
          </react_native_1.View>
        </react_native_1.View>
      </react_portal_1.Portal>);
    }
    return (<ModalStackRouteDrawer_web_1.ModalStackRouteDrawer routeKey={config.uniqueId} onDismiss={onDismissed} themeColors={colors} key={config.uniqueId} options={{
            presentation: (0, utils_1.getStackPresentationType)(config),
            animation: (0, utils_1.getStackAnimationType)(config),
            headerShown: false,
            sheetAllowedDetents: config.detents,
        }} renderScreen={() => (<react_native_1.View style={{ width: '100%', height: '100%' }}>
          <react_native_1.View {...config.viewProps} style={[{ flex: 1 }, config.viewProps?.style]}>
            <ModalComponent_1.ModalComponent modalConfig={config}/>
          </react_native_1.View>
        </react_native_1.View>)}/>);
}
//# sourceMappingURL=ModalsRenderer.web.js.map