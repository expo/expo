'use client';
import { createContext, use, useCallback, useEffect, useRef, useState, } from 'react';
import { ModalsRenderer } from './ModalsRenderer';
const ALLOWED_EVENT_TYPE_LISTENERS = ['close', 'show'];
const ModalContext = createContext(undefined);
export const ModalContextProvider = ({ children }) => {
    const [modalConfigs, setModalConfigs] = useState([]);
    const eventListeners = useRef({
        close: new Set(),
        show: new Set(),
    });
    const prevModalConfigs = useRef([]);
    useEffect(() => {
        if (prevModalConfigs.current !== modalConfigs) {
            prevModalConfigs.current.forEach((config) => {
                if (!modalConfigs.find((c) => c.uniqueId === config.uniqueId)) {
                    emitCloseEvent(config.uniqueId);
                }
            });
            prevModalConfigs.current = modalConfigs;
        }
    }, [modalConfigs]);
    const openModal = useCallback((config) => {
        setModalConfigs((prev) => [...prev, config]);
    }, []);
    const updateModal = useCallback((id, config) => {
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
    const emitCloseEvent = useCallback((id) => {
        eventListeners.current.close.forEach((callback) => callback(id));
    }, []);
    const emitShowEvent = useCallback((id) => {
        eventListeners.current.show.forEach((callback) => callback(id));
    }, []);
    const closeModal = useCallback((id) => {
        setModalConfigs((prev) => {
            const modalIndex = prev.findIndex((config) => config.uniqueId === id);
            if (modalIndex >= 0) {
                return prev.filter((_, index) => index < modalIndex);
            }
            return prev;
        });
    }, []);
    const addEventListener = useCallback((type, callback) => {
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
      <ModalsRenderer modalConfigs={modalConfigs} onDismissed={(id) => {
            closeModal(id);
        }} onShow={emitShowEvent}>
        {children}
      </ModalsRenderer>
    </ModalContext.Provider>);
};
export const useModalContext = () => {
    const context = use(ModalContext);
    if (!context) {
        throw new Error('useModalContext must be used within a ModalContextProvider');
    }
    return context;
};
//# sourceMappingURL=ModalContext.js.map