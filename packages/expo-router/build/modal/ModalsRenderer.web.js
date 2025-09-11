"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModalsRenderer = void 0;
const native_1 = require("@react-navigation/native");
const react_native_1 = require("react-native");
const ModalComponent_1 = require("./ModalComponent");
const utils_1 = require("./utils");
const ModalStackRouteDrawer_1 = require("./web/ModalStackRouteDrawer");
const TransparentModalStackRouteDrawer_1 = require("./web/TransparentModalStackRouteDrawer");
const utils_2 = require("./web/utils");
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
    const isTransparentModal = (0, utils_2.isTransparentModalPresentation)({ presentation });
    const SelectedModalComponent = isTransparentModal
        ? TransparentModalStackRouteDrawer_1.TransparentModalStackRouteDrawer
        : ModalStackRouteDrawer_1.ModalStackRouteDrawer;
    return (<SelectedModalComponent routeKey={config.uniqueId} onDismiss={onDismissed} themeColors={colors} key={config.uniqueId} options={{
            presentation,
            animation: (0, utils_1.getStackAnimationType)(config),
            headerShown: false,
            sheetAllowedDetents: config.detents,
        }} renderScreen={() => (<react_native_1.View style={{ flex: 1 }}>
          <react_native_1.View {...config.viewProps} style={[{ flex: 1 }, config.viewProps?.style]}>
            <ModalComponent_1.ModalComponent modalConfig={config}/>
          </react_native_1.View>
        </react_native_1.View>)}/>);
}
//# sourceMappingURL=ModalsRenderer.web.js.map