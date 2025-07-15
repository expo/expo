"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useModalContext = exports.ModalContextProvider = void 0;
const react_1 = require("react");
const ModalsRenderer_1 = require("./ModalsRenderer");
const ALLOWED_EVENT_TYPE_LISTENERS = ['close', 'show'];
const ModalContext = (0, react_1.createContext)(undefined);
const ModalContextProvider = ({ children }) => {
    const [modalConfigs, setModalConfigs] = (0, react_1.useState)([]);
    const eventListeners = (0, react_1.useRef)({
        close: new Set(),
        show: new Set(),
    });
    const prevModalConfigs = (0, react_1.useRef)([]);
    (0, react_1.useEffect)(() => {
        if (prevModalConfigs.current !== modalConfigs) {
            prevModalConfigs.current.forEach((config) => {
                if (!modalConfigs.find((c) => c.uniqueId === config.uniqueId)) {
                    emitCloseEvent(config.uniqueId);
                }
            });
            prevModalConfigs.current = modalConfigs;
        }
    }, [modalConfigs]);
    const openModal = (0, react_1.useCallback)((config) => {
        setModalConfigs((prev) => [...prev, config]);
    }, []);
    const updateModal = (0, react_1.useCallback)((id, config) => {
        setModalConfigs((prev) => {
            const index = prev.findIndex((c) => c.uniqueId === id);
            if (index >= 0) {
                const updatedConfigs = [...prev];
                updatedConfigs[index] = { ...updatedConfigs[index], ...config };
                return updatedConfigs;
            }
            return prev;
        });
    }, []);
    const emitCloseEvent = (0, react_1.useCallback)((id) => {
        eventListeners.current.close.forEach((callback) => callback(id));
    }, []);
    const emitShowEvent = (0, react_1.useCallback)((id) => {
        eventListeners.current.show.forEach((callback) => callback(id));
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
        if (!ALLOWED_EVENT_TYPE_LISTENERS.includes(type))
            return () => { };
        if (!callback) {
            console.warn('Passing undefined as a callback to addEventListener is forbidden');
            return () => { };
        }
        eventListeners.current[type].add(callback);
        return () => {
            eventListeners.current[type].delete(callback);
        };
    }, []);
    return (<ModalContext.Provider value={{
            modalConfigs,
            openModal,
            closeModal,
            updateModal,
            addEventListener,
        }}>
      <ModalsRenderer_1.ModalsRenderer modalConfigs={modalConfigs} onDismissed={(id) => {
            closeModal(id);
        }} onShow={emitShowEvent}>
        {children}
      </ModalsRenderer_1.ModalsRenderer>
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