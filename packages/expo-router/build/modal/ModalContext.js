"use strict";
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
    const eventListeners = (0, react_1.useRef)(new Set());
    const prevModalConfigs = (0, react_1.useRef)([]);
    (0, react_1.useEffect)(() => {
        if (prevModalConfigs.current !== modalConfigs) {
            prevModalConfigs.current.forEach((config) => {
                if (!modalConfigs.find((c) => c.uniqueId === config.uniqueId)) {
                    eventListeners.current.forEach((callback) => callback(config.uniqueId));
                }
            });
            prevModalConfigs.current = modalConfigs;
        }
    }, [modalConfigs]);
    const openModal = (0, react_1.useCallback)((config) => setModalConfigs((prev) => [...prev, config]), []);
    const emitCloseEvent = (0, react_1.useCallback)((id) => {
        eventListeners.current.forEach((callback) => callback(id));
    }, []);
    const closeModal = (0, react_1.useCallback)((id) => {
        console.log(`Closing modal with id: ${id}`);
        setModalConfigs((prev) => {
            const modalIndex = prev.findIndex((config) => config.uniqueId === id);
            if (modalIndex >= 0) {
                return prev.filter((_, index) => index < modalIndex);
            }
            return prev;
        });
    }, []);
    const addEventListener = (0, react_1.useCallback)((type, callback) => {
        if (type !== 'close')
            return () => { };
        if (!callback) {
            console.warn('Passing undefined as a callback to addEventListener is forbidden');
            return () => { };
        }
        eventListeners.current.add(callback);
        return () => {
            eventListeners.current.delete(callback);
        };
    }, []);
    const rootId = (0, react_1.useMemo)(() => (0, non_secure_1.nanoid)(), []);
    return (<react_native_screens_1.ScreenStack style={{ flex: 1 }}>
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
      {modalConfigs.map((config) => (<react_native_screens_1.ScreenStackItem key={config.uniqueId} screenId={`${rootId}${config.uniqueId}`} activityState={2} stackPresentation="modal" style={react_native_1.StyleSheet.absoluteFill} onWillDisappear={() => {
                closeModal(config.uniqueId);
            }} onDisappear={() => {
                emitCloseEvent(config.uniqueId);
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
//# sourceMappingURL=ModalContext.js.map