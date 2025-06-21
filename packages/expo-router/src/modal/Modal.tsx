import { type NavigationProp, type ParamListBase } from '@react-navigation/native';
import { nanoid } from 'nanoid/non-secure';
import { useEffect, useState } from 'react';

import { useModalContext } from './ModalContext';
import { useNavigation } from '../useNavigation';

export interface ModalProps {
  children: React.ReactNode;
  visible: boolean;
  onClose?: () => void;
}

export function Modal({ children, visible, onClose }: ModalProps) {
  const { openModal, closeModal, addEventListener } = useModalContext();
  const [currentModalId, setCurrentModalId] = useState<string | undefined>();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  useEffect(() => {
    if (visible) {
      const newId = nanoid();
      openModal({
        component: children,
        uniqueId: newId,
        parentNavigationProp: navigation,
      });
      setCurrentModalId(newId);
    } else {
      if (currentModalId) {
        closeModal(currentModalId);
      }
    }
    return () => {};
  }, [visible]);

  useEffect(() => {
    if (currentModalId) {
      return addEventListener('close', (id) => {
        if (id === currentModalId) {
          onClose?.();
          setCurrentModalId(undefined);
        }
      });
    }
    return () => {};
  }, [currentModalId, addEventListener, onClose]);
  return null;
}
