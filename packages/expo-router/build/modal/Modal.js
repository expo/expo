"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.Modal = Modal;
const non_secure_1 = require("nanoid/non-secure");
const react_1 = require("react");
const react_native_1 = require("react-native");
const ModalContext_1 = require("./ModalContext");
const useNavigation_1 = require("../useNavigation");
const utils_1 = require("./utils");
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
function Modal(props) {
    const { children, visible, onClose, onShow, animationType, presentationStyle, transparent, detents, closeOnNavigation, ...viewProps } = props;
    const { openModal, updateModal, closeModal, addEventListener } = (0, ModalContext_1.useModalContext)();
    const [currentModalId, setCurrentModalId] = (0, react_1.useState)();
    const navigation = (0, useNavigation_1.useNavigation)();
    (0, react_1.useEffect)(() => {
        if (!(0, utils_1.areDetentsValid)(detents)) {
            throw new Error(`Invalid detents provided to Modal: ${JSON.stringify(detents)}`);
        }
    }, [detents]);
    (0, react_1.useEffect)(() => {
        if (__DEV__ &&
            presentationStyle === 'formSheet' &&
            detents !== 'fitToContents' &&
            process.env.EXPO_OS === 'ios' &&
            react_native_1.StyleSheet.flatten(props.style)?.flex) {
            console.warn(
            // TODO: ENG-16230: Add warning link to documentation
            'The `formSheet` presentation style does not support flex styles on iOS. Consider using a fixed height view or scroll view with `fitToContents` detent instead. See ');
        }
    }, [props.style, presentationStyle, detents]);
    (0, react_1.useEffect)(() => {
        if (visible) {
            const newId = (0, non_secure_1.nanoid)();
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
    (0, react_1.useEffect)(() => {
        if (navigation.isFocused()) {
            return navigation.addListener('blur', () => {
                if (currentModalId && closeOnNavigation) {
                    closeModal(currentModalId);
                }
            });
        }
        return () => { };
    }, [navigation, closeModal, currentModalId, closeOnNavigation]);
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