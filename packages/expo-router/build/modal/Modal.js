"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.Modal = Modal;
const non_secure_1 = require("nanoid/non-secure");
const react_1 = require("react");
const react_native_1 = require("react-native");
const ModalContext_1 = require("./ModalContext");
const Portal_1 = require("./Portal");
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
    const { children, visible, onClose, onShow, animationType, presentationStyle, transparent, ...viewProps } = props;
    const { openModal, closeModal, addEventListener } = (0, ModalContext_1.useModalContext)();
    const [currentModalId, setCurrentModalId] = (0, react_1.useState)();
    (0, react_1.useEffect)(() => {
        if (!currentModalId && visible) {
            const newId = (0, non_secure_1.nanoid)();
            openModal({
                animationType,
                presentationStyle,
                transparent,
                viewProps,
                uniqueId: newId,
            });
            setCurrentModalId(newId);
            return () => {
                closeModal(newId);
            };
        }
        else if (currentModalId && !visible) {
            closeModal(currentModalId);
            setCurrentModalId(undefined);
        }
        return () => { };
    }, [visible]);
    (0, react_1.useEffect)(() => {
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
    }, [currentModalId, addEventListener, onClose]);
    if (!currentModalId || !visible) {
        return null;
    }
    return (<Portal_1.ModalPortalContent hostId={currentModalId}>
      <react_native_1.View {...viewProps} style={react_native_1.StyleSheet.flatten([{ flex: 1 }, viewProps.style])}>
        {children}
      </react_native_1.View>
    </Portal_1.ModalPortalContent>);
}
//# sourceMappingURL=Modal.js.map