import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import { nanoid } from 'nanoid/non-secure';
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { StyleSheet } from 'react-native';
import { ScreenStack, ScreenStackItem } from 'react-native-screens';

import { ModalComponent } from './ModalComponent';

export interface ModalConfig {
  component: React.ReactNode;
  parentNavigationProp: NavigationProp<ParamListBase>;
  uniqueId: string;
}

export interface ModalContextType {
  modalConfigs: ModalConfig[];
  openModal: (config: ModalConfig) => void;
  closeModal: (id: string) => void;
  addEventListener: (type: 'close', callback: (id: string) => void) => () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalContextProvider = ({ children }: PropsWithChildren) => {
  const [modalConfigs, setModalConfigs] = useState<ModalConfig[]>([]);
  const eventListeners = useRef<Set<(id: string) => void>>(new Set());
  const prevModalConfigs = useRef<ModalConfig[]>([]);

  useEffect(() => {
    if (prevModalConfigs.current !== modalConfigs) {
      prevModalConfigs.current.forEach((config) => {
        if (!modalConfigs.find((c) => c.uniqueId === config.uniqueId)) {
          eventListeners.current.forEach((callback) => callback(config.uniqueId));
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
    eventListeners.current.forEach((callback) => callback(id));
  }, []);

  const closeModal = useCallback((id: string) => {
    console.log(`Closing modal with id: ${id}`);
    setModalConfigs((prev) => {
      const modalIndex = prev.findIndex((config) => config.uniqueId === id);
      if (modalIndex >= 0) {
        return prev.filter((_, index) => index < modalIndex);
      }
      return prev;
    });
  }, []);

  const addEventListener = useCallback((type: 'close', callback: (id: string) => void) => {
    if (type !== 'close') return () => {};

    if (!callback) {
      console.warn('Passing undefined as a callback to addEventListener is forbidden');
      return () => {};
    }

    eventListeners.current.add(callback);

    return () => {
      eventListeners.current.delete(callback);
    };
  }, []);

  const rootId = useMemo(() => nanoid(), []);

  return (
    <ScreenStack style={{ flex: 1 }}>
      <ScreenStackItem
        screenId={rootId}
        activityState={2}
        style={StyleSheet.absoluteFill}
        headerConfig={{
          hidden: true,
        }}>
        <ModalContext.Provider
          value={{
            modalConfigs,
            openModal,
            closeModal,
            addEventListener,
          }}>
          {children}
        </ModalContext.Provider>
      </ScreenStackItem>
      {modalConfigs.map((config) => (
        <ScreenStackItem
          key={config.uniqueId}
          screenId={`${rootId}${config.uniqueId}`}
          activityState={2}
          stackPresentation="modal"
          style={StyleSheet.absoluteFill}
          onWillDisappear={() => {
            closeModal(config.uniqueId);
          }}
          onDisappear={() => {
            emitCloseEvent(config.uniqueId);
          }}>
          <ModalComponent modalConfig={config} />
        </ScreenStackItem>
      ))}
    </ScreenStack>
  );
};

export const useModalContext = () => {
  const context = use(ModalContext);
  if (!context) {
    throw new Error('useModalContext must be used within a ModalContextProvider');
  }
  return context;
};
