"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useModalContext = exports.ModalContextProvider = void 0;
const react_1 = require("react");
const useNavigation_1 = require("../useNavigation");
const ModalContext = (0, react_1.createContext)(undefined);
const ModalContextProvider = ({ children }) => {
    const navigation = (0, useNavigation_1.useNavigation)();
    const [modalConfig, setModalConfig] = (0, react_1.useState)(undefined);
    const isOpen = (0, react_1.useRef)(false);
    const [eventListeners, setEventListeners] = (0, react_1.useState)(new Set());
    const openModal = (0, react_1.useCallback)(function openModal(config) {
        setModalConfig(config);
        navigation.navigate('__internal__modal');
        isOpen.current = true;
    }, [navigation]);
    const closeModal = (0, react_1.useCallback)((isNative) => {
        if (modalConfig) {
            setModalConfig(undefined);
            if (isOpen.current) {
                eventListeners.forEach((listener) => listener());
                if (!isNative) {
                    navigation.goBack();
                }
            }
        }
        isOpen.current = false;
    }, [modalConfig, navigation, eventListeners]);
    const addEventListener = (0, react_1.useCallback)((type, callback) => {
        if (type !== 'close')
            return () => { };
        if (!callback) {
            console.warn('Passing undefined as a callback to addEventListener is forbidden');
            return () => { };
        }
        setEventListeners((prev) => {
            const newSet = new Set(prev);
            newSet.add(callback);
            return newSet;
        });
        return () => {
            setEventListeners((prev) => {
                const newSet = new Set(prev);
                newSet.delete(callback);
                return newSet;
            });
        };
    }, []);
    return (<ModalContext.Provider value={{
            modalConfig,
            openModal,
            closeModal,
            addEventListener,
        }}>
      {children}
    </ModalContext.Provider>);
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