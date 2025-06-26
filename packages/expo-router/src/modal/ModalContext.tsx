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

  const rootId = useMemo(() => nanoid(), []);

  return (
    <ScreenStack style={styles.stackContainer}>
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
