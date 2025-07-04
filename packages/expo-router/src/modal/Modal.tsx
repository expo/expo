'use client';

import { type NavigationProp, type ParamListBase } from '@react-navigation/native';
import { nanoid } from 'nanoid/non-secure';
import { useEffect, useState } from 'react';
import { ViewProps } from 'react-native';
import { type ScreenProps } from 'react-native-screens';

import { useModalContext, type ModalConfig } from './ModalContext';
import { useNavigation } from '../useNavigation';

export interface ModalProps extends ViewProps {
  /**
   * The content of the modal.
   */
  children?: React.ReactNode;
  /**
   * Whether the modal is visible or not.
   * When set to `true`, the modal will be opened.
   * When set to `false`, the modal will be closed.
   */
  visible: boolean;
  /**
   * Callback that is called after modal is closed with native dismissal (e.g. drag down or back button press).
   */
  onRequestClose?: () => void;
  /**
   * Callback that is called after modal is closed.
   * This is called when the modal is closed programmatically or when the user dismisses it.
   */
  onDidClose?: () => void;
  /**
   * Callback that is called after modal is shown.
   */
  onShow?: () => void;
  /**
   * The animation type for the modal.
   * This can be one of 'none', 'slide', or 'fade'.
   */
  animationType?: ModalConfig['animationType'];
  /**
   * The presentation style for the modal.
   * This can be one of 'fullScreen', 'pageSheet', 'formSheet', or 'overFullScreen'.
   * - `fullScreen`: The modal covers the entire screen. When `transparent` is set to `true`, it will fallback to `overFullScreen`.
   * - `pageSheet`: The modal is presented as a page sheet on iOS. Defaults to `fullScreen` on Android.
   * - `formSheet`: The modal is presented as a form sheet.
   * - `overFullScreen`: The modal is presented over the full screen, allowing interaction with the underlying content.
   *
   * @default 'fullScreen'
   */
  presentationStyle?: ModalConfig['presentationStyle'];
  /**
   * Whether the modal should be rendered as a transparent overlay.
   * This will render the modal without a background, allowing the content behind it to be visible.
   *
   * On Android, this will fallback to `overFullScreen` presentation style.
   */
  transparent?: boolean;
  /**
   * See {@link ScreenProps["sheetAllowedDetents"]}.
   *
   * Describes heights where a sheet can rest.
   * Works only when `presentation` is set to `formSheet`.
   *
   * Heights should be described as fraction (a number from `[0, 1]` interval) of screen height / maximum detent height.
   * You can pass an array of ascending values each defining allowed sheet detent. iOS accepts any number of detents,
   * while **Android is limited to three**.
   */
  detents?: ModalConfig['detents'];
}

/**
 * A standalone modal component that can be used in Expo Router apps.
 * It always renders on top of the application's content.
 * Internally, the modal is rendered as a `Stack.Screen`, with the presentation style determined by the `presentationStyle` prop.
 *
 * This component is not linkable. If you need to link to a modal, use `<Stack.Screen options={{ presentationStyle: "modal" }} />` instead.
 *
 * @example
 * ```tsx
 * import { Modal } from 'expo-router';
 *
 * function Page() {
 *  const [modalVisible, setModalVisible] = useState(false);
 *  return (
 *    <Modal
 *      visible={modalVisible}
 *      onClose={() => setModalVisible(false)}
 *    >
 *      <Text>Hello World</Text>
 *    </Modal>
 *  );
 * }
 */
export function Modal(props: ModalProps) {
  const {
    children,
    visible,
    onRequestClose,
    onDidClose,
    onShow,
    animationType,
    presentationStyle,
    transparent,
    detents,
    ...viewProps
  } = props;
  const { openModal, updateModal, closeModal, addEventListener } = useModalContext();
  const [currentModalId, setCurrentModalId] = useState<string | undefined>();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  useEffect(() => {
    if (!currentModalId && visible) {
      const newId = nanoid();
      openModal({
        animationType,
        presentationStyle,
        transparent,
        viewProps,
        detents,
        component: children,
        uniqueId: newId,
        parentNavigationProp: navigation,
      });
      setCurrentModalId(newId);
      return () => {
        closeModal(newId);
      };
    } else if (currentModalId && !visible) {
      setCurrentModalId(undefined);
    }
    return () => {};
  }, [visible]);

  useEffect(() => {
    if (currentModalId && visible) {
      updateModal(currentModalId, {
        component: children,
      });
    }
  }, [children]);

  useEffect(() => {
    if (currentModalId) {
      const unsubscribeShow = addEventListener('show', (id) => {
        if (id === currentModalId) {
          onShow?.();
        }
      });
      const unsubscribeClose = addEventListener('close', (id) => {
        if (id === currentModalId) {
          onRequestClose?.();
          setCurrentModalId(undefined);
        }
      });
      const unsubscribeDidClose = addEventListener('didClose', (id) => {
        if (id === currentModalId) {
          onDidClose?.();
          setCurrentModalId(undefined);
        }
      });
      return () => {
        unsubscribeShow();
        unsubscribeClose();
        unsubscribeDidClose();
      };
    }
    return () => {};
  }, [currentModalId, addEventListener, onRequestClose]);
  return null;
}
