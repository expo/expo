"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.Modal = Modal;
const non_secure_1 = require("nanoid/non-secure");
const react_1 = require("react");
const ModalContext_1 = require("./ModalContext");
const useNavigation_1 = require("../useNavigation");
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
function Modal(props) {
    const { children, visible, onRequestClose, onDidClose, onShow, animationType, presentationStyle, transparent, detents, ...viewProps } = props;
    const { openModal, updateModal, closeModal, addEventListener } = (0, ModalContext_1.useModalContext)();
    const [currentModalId, setCurrentModalId] = (0, react_1.useState)();
    const navigation = (0, useNavigation_1.useNavigation)();
    (0, react_1.useEffect)(() => {
        if (!currentModalId && visible) {
            const newId = (0, non_secure_1.nanoid)();
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
        }
        else if (currentModalId && !visible) {
            setCurrentModalId(undefined);
        }
        return () => { };
    }, [visible]);
    (0, react_1.useEffect)(() => {
        if (currentModalId && visible) {
            updateModal(currentModalId, {
                component: children,
            });
        }
    }, [children]);
    (0, react_1.useEffect)(() => {
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
        return () => { };
    }, [currentModalId, addEventListener, onRequestClose]);
    return null;
}
//# sourceMappingURL=Modal.js.map