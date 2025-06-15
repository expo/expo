import { NavigationProp, type ParamListBase } from '@react-navigation/native';
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
  const { modalConfig, openModal, closeModal, addEventListener } = useModalContext();
  const [currentModalId, setCurrentModalId] = useState<string | undefined>();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const openModalId = modalConfig?.uniqueId;
  useEffect(() => {
    if (visible) {
      if (openModalId) {
        throw new Error('Cannot open modal inside modal');
      }
      const newId = nanoid();
      openModal({
        component: children,
        uniqueId: newId,
        navigationProp: navigation,
      });
      setCurrentModalId(newId);
      if (onClose) {
        return addEventListener('close', onClose);
      }
    } else {
      if (openModalId && currentModalId === openModalId) {
        closeModal();
      }
    }
    return () => {};
  }, [visible]);
  return null;
}
