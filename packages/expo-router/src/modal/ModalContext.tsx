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

const ALLOWED_EVENT_TYPE_LISTENERS = ['didClose', 'close', 'show'] as const;
type AllowedEventTypeListeners = (typeof ALLOWED_EVENT_TYPE_LISTENERS)[number];

export interface ModalContextType {
  modalConfigs: ModalConfig[];
  openModal: (config: ModalConfig) => void;
  updateModal: (id: string, config: Omit<Partial<ModalConfig>, 'uniqueId'>) => void;
  closeModal: (id: string) => void;
  addEventListener: (type: AllowedEventTypeListeners, callback: (id: string) => void) => () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalContextProvider = ({ children }: PropsWithChildren) => {
  const [modalConfigs, setModalConfigs] = useState<ModalConfig[]>([]);
  const eventListeners = useRef<Record<AllowedEventTypeListeners, Set<(id: string) => void>>>({
    didClose: new Set(),
    close: new Set(),
    show: new Set(),
  });
  const prevModalConfigs = useRef<ModalConfig[]>([]);

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

  const openModal = useCallback((config: ModalConfig) => {
    setModalConfigs((prev) => [...prev, config]);
  }, []);

  const updateModal = useCallback((id: string, config: Omit<Partial<ModalConfig>, 'uniqueId'>) => {
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

  const emitCloseEvent = useCallback((id: string) => {
    eventListeners.current.close.forEach((callback) => callback(id));
  }, []);

  const emitDidCloseEvent = useCallback((id: string) => {
    eventListeners.current.didClose.forEach((callback) => callback(id));
  }, []);

  const emitShowEvent = useCallback((id: string) => {
    eventListeners.current.show.forEach((callback) => callback(id));
  }, []);

  const closeModal = useCallback((id: string) => {
    setModalConfigs((prev) => {
      const modalIndex = prev.findIndex((config) => config.uniqueId === id);
      if (modalIndex >= 0) {
        return prev.filter((_, index) => index < modalIndex);
      }
      return prev;
    });
    emitDidCloseEvent(id);
  }, []);

  const addEventListener = useCallback(
    (type: AllowedEventTypeListeners, callback: (id: string) => void) => {
      if (!ALLOWED_EVENT_TYPE_LISTENERS.includes(type)) return () => {};

      if (!callback) {
        console.warn('Passing undefined as a callback to addEventListener is forbidden');
        return () => {};
      }

      eventListeners.current[type].add(callback);

      return () => {
        eventListeners.current[type].delete(callback);
      };
    },
    []
  );

  return (
    <ModalContext.Provider
      value={{
        modalConfigs,
        openModal,
        closeModal,
        updateModal,
        addEventListener,
      }}>
      <ModalsRenderer
        modalConfigs={modalConfigs}
        onDismissed={emitCloseEvent}
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
