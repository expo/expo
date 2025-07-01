'use client';

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
import { StyleSheet, type ViewProps } from 'react-native';
import {
  ScreenStack,
  ScreenStackItem,
  type StackAnimationTypes,
  type StackPresentationTypes,
} from 'react-native-screens';

import { ModalComponent } from './ModalComponent';

export interface ModalConfig {
  component: React.ReactNode;
  parentNavigationProp: NavigationProp<ParamListBase>;
  uniqueId: string;
  animationType?: 'slide' | 'fade' | 'none';
  presentationStyle?: 'fullScreen' | 'overFullScreen' | 'pageSheet' | 'formSheet';
  transparent?: boolean;
  viewProps?: ViewProps;
  detents?: number[] | 'fitToContents';
}

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

  const rootId = useMemo(() => nanoid(), []);

  return (
    <ModalContext.Provider
      value={{
        modalConfigs,
        openModal,
        closeModal,
        updateModal,
        addEventListener,
      }}>
      <ScreenStack style={styles.stackContainer}>
        <ScreenStackItem
          screenId={rootId}
          activityState={2}
          style={StyleSheet.absoluteFill}
          headerConfig={{
            hidden: true,
          }}>
          {children}
        </ScreenStackItem>
        {modalConfigs.map((config) => (
          <ScreenStackItem
            key={config.uniqueId}
            {...config.viewProps}
            screenId={`${rootId}${config.uniqueId}`}
            activityState={2}
            stackPresentation={getStackPresentationType(config)}
            stackAnimation={getStackAnimationType(config)}
            nativeBackButtonDismissalEnabled
            headerConfig={{
              hidden: true,
            }}
            contentStyle={[
              {
                flex: 1,
                backgroundColor: config.transparent ? 'transparent' : 'white',
              },
              config.viewProps?.style,
            ]}
            sheetAllowedDetents={config.detents}
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: config.transparent ? 'transparent' : 'white',
              },
            ]}
            onDismissed={() => {
              closeModal(config.uniqueId);
              emitCloseEvent(config.uniqueId);
            }}
            onAppear={() => {
              emitShowEvent(config.uniqueId);
            }}>
            <ModalComponent modalConfig={config} />
          </ScreenStackItem>
        ))}
      </ScreenStack>
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

function getStackAnimationType(config: ModalConfig): StackAnimationTypes | undefined {
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

function getStackPresentationType(config: ModalConfig): StackPresentationTypes {
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

const styles = StyleSheet.create({
  stackContainer: {
    flex: 1,
  },
});
