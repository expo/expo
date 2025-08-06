"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModalsRenderer = void 0;
const non_secure_1 = require("nanoid/non-secure");
const react_1 = require("react");
const react_native_1 = require("react-native");
const react_native_screens_1 = require("react-native-screens");
const ModalComponent_1 = require("./ModalComponent");
const utils_1 = require("./utils");
const ModalsRenderer = ({ children, modalConfigs, onDismissed, onShow, }) => {
    const rootId = (0, react_1.useRef)((0, non_secure_1.nanoid)());
    return (<react_native_screens_1.ScreenStack style={styles.stackContainer}>
      <react_native_screens_1.ScreenStackItem screenId={rootId.current} activityState={2} style={react_native_1.StyleSheet.absoluteFill} headerConfig={{
            hidden: true,
        }}>
        {children}
      </react_native_screens_1.ScreenStackItem>
      {modalConfigs.map((config) => (<react_native_screens_1.ScreenStackItem key={config.uniqueId} {...config.viewProps} screenId={`${rootId.current}${config.uniqueId}`} activityState={2} stackPresentation={(0, utils_1.getStackPresentationType)(config)} stackAnimation={(0, utils_1.getStackAnimationType)(config)} nativeBackButtonDismissalEnabled headerConfig={{
                hidden: true,
            }} contentStyle={[
                {
                    flex: config.presentationStyle !== 'formSheet' ? 1 : undefined,
                    backgroundColor: config.transparent ? 'transparent' : 'white',
                },
                config.viewProps?.style,
            ]} sheetAllowedDetents={config.detents} style={[
                react_native_1.StyleSheet.absoluteFill,
                {
                    backgroundColor: config.transparent ? 'transparent' : 'white',
                },
            ]} onDismissed={() => {
                onDismissed?.(config.uniqueId);
            }} onAppear={() => {
                onShow?.(config.uniqueId);
            }}>
          <ModalComponent_1.ModalComponent modalConfig={config}/>
        </react_native_screens_1.ScreenStackItem>))}
    </react_native_screens_1.ScreenStack>);
};
exports.ModalsRenderer = ModalsRenderer;
const styles = react_native_1.StyleSheet.create({
    stackContainer: {
        flex: 1,
    },
});
//# sourceMappingURL=ModalsRenderer.js.map