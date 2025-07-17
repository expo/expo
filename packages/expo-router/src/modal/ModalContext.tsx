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
import { DetentChangeData, type ModalConfig } from './types';

export { type ModalConfig };

type EventCallbackMap = {
  close: (id: string) => void;
  show: (id: string) => void;
  detentChange: (id: string, data: DetentChangeData) => void;
};

type AllowedEventTypeListeners = keyof EventCallbackMap;
const ALLOWED_EVENT_TYPE_LISTENERS: AllowedEventTypeListeners[] = ['close', 'show', 'detentChange'];

export interface ModalContextType {
  modalConfigs: ModalConfig[];
  openModal: (config: ModalConfig) => void;
  updateModal: (id: string, config: Omit<Partial<ModalConfig>, 'uniqueId'>) => void;
  closeModal: (id: string) => void;
  addEventListener: <T extends AllowedEventTypeListeners>(
    type: T,
    callback: EventCallbackMap[T]
  ) => () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalContextProvider = ({ children }: PropsWithChildren) => {
  const [modalConfigs, setModalConfigs] = useState<ModalConfig[]>([]);

  // Use a more flexible type for event listeners
  const eventListeners = useRef<{
    [K in AllowedEventTypeListeners]: Set<EventCallbackMap[K]>;
  }>({
    close: new Set(),
    show: new Set(),
    detentChange: new Set(),
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

  const emitShowEvent = useCallback((id: string) => {
    eventListeners.current.show.forEach((callback) => callback(id));
  }, []);

  const emitDetentChangeEvent = useCallback((id: string, data: DetentChangeData) => {
    eventListeners.current.detentChange.forEach((callback) => callback(id, data));
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

  const addEventListener = useCallback(
    <T extends AllowedEventTypeListeners>(type: T, callback: EventCallbackMap[T]) => {
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
        onDismissed={(id) => {
          closeModal(id);
        }}
        onShow={emitShowEvent}
        onDetentChange={emitDetentChangeEvent}>
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
