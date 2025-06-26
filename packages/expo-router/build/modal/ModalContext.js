"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useModalContext = exports.ModalContextProvider = void 0;
const non_secure_1 = require("nanoid/non-secure");
const react_1 = require("react");
const react_native_1 = require("react-native");
const react_native_screens_1 = require("react-native-screens");
const ModalComponent_1 = require("./ModalComponent");
const ModalContext = (0, react_1.createContext)(undefined);
const ModalContextProvider = ({ children }) => {
    const [modalConfigs, setModalConfigs] = (0, react_1.useState)([]);
    const closeEventListeners = (0, react_1.useRef)(new Set());
    const showEventListeners = (0, react_1.useRef)(new Set());
    const prevModalConfigs = (0, react_1.useRef)([]);
    (0, react_1.useEffect)(() => {
        if (prevModalConfigs.current !== modalConfigs) {
            prevModalConfigs.current.forEach((config) => {
                if (!modalConfigs.find((c) => c.uniqueId === config.uniqueId)) {
                    closeEventListeners.current.forEach((callback) => callback(config.uniqueId));
                }
            });
            prevModalConfigs.current = modalConfigs;
        }
    }, [modalConfigs]);
    const openModal = (0, react_1.useCallback)((config) => setModalConfigs((prev) => [...prev, config]), []);
    const emitCloseEvent = (0, react_1.useCallback)((id) => {
        closeEventListeners.current.forEach((callback) => callback(id));
    }, []);
    const emitShowEvent = (0, react_1.useCallback)((id) => {
        showEventListeners.current.forEach((callback) => callback(id));
    }, []);
    const closeModal = (0, react_1.useCallback)((id) => {
        setModalConfigs((prev) => {
            const modalIndex = prev.findIndex((config) => config.uniqueId === id);
            if (modalIndex >= 0) {
                return prev.filter((_, index) => index < modalIndex);
            }
            return prev;
        });
    }, []);
    const addEventListener = (0, react_1.useCallback)((type, callback) => {
        if (type !== 'close' && type !== 'show')
            return () => { };
        if (!callback) {
            console.warn('Passing undefined as a callback to addEventListener is forbidden');
            return () => { };
        }
        const eventListeners = type === 'close' ? closeEventListeners : showEventListeners;
        eventListeners.current.add(callback);
        return () => {
            eventListeners.current.delete(callback);
        };
    }, []);
    const rootId = (0, react_1.useMemo)(() => (0, non_secure_1.nanoid)(), []);
    return (<react_native_screens_1.ScreenStack style={styles.stackContainer}>
      <react_native_screens_1.ScreenStackItem screenId={rootId} activityState={2} style={react_native_1.StyleSheet.absoluteFill} headerConfig={{
            hidden: true,
        }}>
        <ModalContext.Provider value={{
            modalConfigs,
            openModal,
            closeModal,
            addEventListener,
        }}>
          {children}
        </ModalContext.Provider>
      </react_native_screens_1.ScreenStackItem>
      {modalConfigs.map((config) => (<react_native_screens_1.ScreenStackItem key={config.uniqueId} {...config.viewProps} screenId={`${rootId}${config.uniqueId}`} activityState={2} stackPresentation={getStackPresentationType(config)} stackAnimation={getStackAnimationType(config)} nativeBackButtonDismissalEnabled headerConfig={{
                hidden: true,
            }} contentStyle={[
                {
                    flex: 1,
                    backgroundColor: config.transparent ? 'transparent' : 'white',
                },
                config.viewProps?.style,
            ]} sheetAllowedDetents={config.detents} style={[
                react_native_1.StyleSheet.absoluteFill,
                {
                    backgroundColor: config.transparent ? 'transparent' : 'white',
                },
            ]} onDismissed={() => {
                closeModal(config.uniqueId);
                emitCloseEvent(config.uniqueId);
            }} onAppear={() => {
                emitShowEvent(config.uniqueId);
            }}>
          <ModalComponent_1.ModalComponent modalConfig={config}/>
        </react_native_screens_1.ScreenStackItem>))}
    </react_native_screens_1.ScreenStack>);
};
exports.ModalContextProvider = ModalContextProvider;
const useModalContext = () => {
    const context = (0, react_1.use)(ModalContext);
    if (!context) {
        throw new Error('useModalContext must be used within a ModalContextProvider');
    }
    return context;
};
exports.useModalContext = useModalContext;
function getStackAnimationType(config) {
    switch (config.animationType) {
        case 'fade':
            return 'fade';
        case 'none':
            return 'none';
        case 'slide':
        default:
            return 'slide_from_bottom';
    }
}
function getStackPresentationType(config) {
    if (process.env.EXPO_OS === 'android') {
        if (config.transparent) {
            return 'transparentModal';
        }
        switch (config.presentationStyle) {
            case 'fullScreen':
                return 'fullScreenModal';
            case 'overFullScreen':
                return 'transparentModal';
            case 'pageSheet':
                return 'pageSheet';
            case 'formSheet':
                return 'formSheet';
            default:
                return 'fullScreenModal';
        }
    }
    switch (config.presentationStyle) {
        case 'overFullScreen':
            return 'transparentModal';
        case 'pageSheet':
            return 'pageSheet';
        case 'formSheet':
            return 'formSheet';
        case 'fullScreen':
        default:
            if (config.transparent) {
                return 'transparentModal';
            }
            return 'fullScreenModal';
    }
}
const styles = react_native_1.StyleSheet.create({
    stackContainer: {
        flex: 1,
    },
});
//# sourceMappingURL=ModalContext.js.map