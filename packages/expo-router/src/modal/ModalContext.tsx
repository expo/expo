'use client';

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import { ModalsRenderer } from './ModalsRenderer';
import { type ModalConfig } from './types';

export { type ModalConfig };

export interface ModalContextType {
  modalConfigs: ModalConfig[];
  openModal: (config: ModalConfig) => void;
  closeModal: (id: string) => void;
  addEventListener: (type: 'close' | 'show', callback: (id: string) => void) => () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalContextProvider = ({ children }: PropsWithChildren) => {
  const [modalConfigs, setModalConfigs] = useState<ModalConfig[]>([]);
  const closeEventListeners = useRef<Set<(id: string) => void>>(new Set());
  const showEventListeners = useRef<Set<(id: string) => void>>(new Set());
  const prevModalConfigs = useRef<ModalConfig[]>([]);

  useEffect(() => {
    if (prevModalConfigs.current !== modalConfigs) {
      prevModalConfigs.current.forEach((config) => {
        if (!modalConfigs.find((c) => c.uniqueId === config.uniqueId)) {
          closeEventListeners.current.forEach((callback) => callback(config.uniqueId));
        }
      });
      prevModalConfigs.current = modalConfigs;
    }
  }, [modalConfigs]);

  const openModal = useCallback(
    (config: ModalConfig) => setModalConfigs((prev) => [...prev, config]),
    []
  );

  const emitCloseEvent = useCallback((id: string) => {
    closeEventListeners.current.forEach((callback) => callback(id));
  }, []);

  const emitShowEvent = useCallback((id: string) => {
    showEventListeners.current.forEach((callback) => callback(id));
  }, []);

  const closeModal = useCallback((id: string) => {
    setModalConfigs((prev) => {
      const modalIndex = prev.findIndex((config) => config.uniqueId === id);
      if (modalIndex >= 0) {
        return prev.filter((_, index) => index < modalIndex);
      }
      return prev;
    });
  }, []);

  const addEventListener = useCallback((type: 'close' | 'show', callback: (id: string) => void) => {
    if (type !== 'close' && type !== 'show') return () => {};

    if (!callback) {
      console.warn('Passing undefined as a callback to addEventListener is forbidden');
      return () => {};
    }

    const eventListeners = type === 'close' ? closeEventListeners : showEventListeners;
    eventListeners.current.add(callback);

    return () => {
      eventListeners.current.delete(callback);
    };
  }, []);

  return (
    <ModalContext.Provider
      value={{
        modalConfigs,
        openModal,
        closeModal,
        addEventListener,
      }}>
      <ModalsRenderer
        modalConfigs={modalConfigs}
        onDismissed={(id) => {
          closeModal(id);
          emitCloseEvent(id);
        }}
        onShow={emitShowEvent}>
        {children}
      </ModalsRenderer>
    </ModalContext.Provider>
  );
};

export const useModalContext = () => {
  const context = use(ModalContext);
  if (!context) {
    throw new Error('useModalContext must be used within a ModalContextProvider');
  }
  return context;
};
