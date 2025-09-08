'use client';
import { nanoid } from 'nanoid/non-secure';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useModalContext } from './ModalContext';
import { useNavigation } from '../useNavigation';
import { areDetentsValid } from './utils';
/**
 * A standalone modal component that can be used in Expo Router apps.
 * It always renders on top of the application's content.
 * Internally, the modal is rendered as a `Stack.Screen`, with the presentation style determined by the `presentationStyle` prop.
 *
 * **Props should be set before the modal is opened. Changes to the props will take effect after the modal is reopened.**
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
export function Modal(props) {
    const { children, visible, onClose, onShow, animationType, presentationStyle, transparent, detents, closeOnNavigation, ...viewProps } = props;
    const { openModal, updateModal, closeModal, addEventListener } = useModalContext();
    const [currentModalId, setCurrentModalId] = useState();
    const navigation = useNavigation();
    useEffect(() => {
        if (!areDetentsValid(detents)) {
            throw new Error(`Invalid detents provided to Modal: ${JSON.stringify(detents)}`);
        }
    }, [detents]);
    useEffect(() => {
        if (__DEV__ &&
            presentationStyle === 'formSheet' &&
            detents !== 'fitToContents' &&
            process.env.EXPO_OS === 'ios' &&
            StyleSheet.flatten(props.style)?.flex) {
            console.warn(
            // TODO: ENG-16230: Add warning link to documentation
            'The `formSheet` presentation style does not support flex styles on iOS. Consider using a fixed height view or scroll view with `fitToContents` detent instead. See ');
        }
    }, [props.style, presentationStyle, detents]);
    useEffect(() => {
        if (visible) {
            const newId = nanoid();
            openModal({
                animationType,
                presentationStyle,
                transparent,
                viewProps,
                component: children,
                uniqueId: newId,
                parentNavigationProp: navigation,
                detents: detents ?? (presentationStyle === 'formSheet' ? 'fitToContents' : undefined),
            });
            setCurrentModalId(newId);
            return () => {
                closeModal(newId);
            };
        }
        return () => { };
    }, [visible]);
    useEffect(() => {
        if (navigation.isFocused()) {
            return navigation.addListener('blur', () => {
                if (currentModalId && closeOnNavigation) {
                    closeModal(currentModalId);
                }
            });
        }
        return () => { };
    }, [navigation, closeModal, currentModalId, closeOnNavigation]);
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
                    onClose?.();
                    setCurrentModalId(undefined);
                }
            });
            return () => {
                unsubscribeShow();
                unsubscribeClose();
            };
        }
        return () => { };
    }, [currentModalId, addEventListener, onClose, onShow]);
    return null;
}
//# sourceMappingURL=Modal.js.map