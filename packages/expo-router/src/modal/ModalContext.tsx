import { NavigationProp, type ParamListBase } from '@react-navigation/native';
import { createContext, use, useCallback, useRef, useState, type PropsWithChildren } from 'react';

import { useNavigation } from '../useNavigation';

interface ModalConfig {
  component: React.ReactNode;
  navigationProp: NavigationProp<ParamListBase>;
  uniqueId: string;
}

export interface ModalContextType {
  modalConfig: ModalConfig | undefined;
  openModal: (config: ModalConfig) => void;
  closeModal: (isNative?: boolean) => void;
  addEventListener: (type: 'close', callback: () => void) => () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalContextProvider = ({ children }: PropsWithChildren) => {
  const navigation = useNavigation<NavigationProp<{ __internal__modal: undefined }>>();
  const [modalConfig, setModalConfig] = useState<ModalConfig | undefined>(undefined);
  const isOpen = useRef(false);
  const [eventListeners, setEventListeners] = useState<Set<() => void>>(new Set());

  const openModal = useCallback(
    function openModal<T extends NavigationProp<ParamListBase> = NavigationProp<ParamListBase>>(
      config: ModalConfig
    ) {
      setModalConfig(config);
      navigation.navigate('__internal__modal');
      isOpen.current = true;
    },
    [navigation]
  );

  const closeModal = useCallback(
    (isNative?: boolean) => {
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
    },
    [modalConfig, navigation, eventListeners]
  );

  const addEventListener = useCallback((type: 'close', callback: () => void) => {
    if (type !== 'close') return () => {};

    if (!callback) {
      console.warn('Passing undefined as a callback to addEventListener is forbidden');
      return () => {};
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

  return (
    <ModalContext.Provider
      value={{
        modalConfig,
        openModal,
        closeModal,
        addEventListener,
      }}>
      {children}
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
