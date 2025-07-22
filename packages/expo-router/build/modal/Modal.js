"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.Modal = Modal;
const non_secure_1 = require("nanoid/non-secure");
const react_1 = require("react");
const react_native_1 = require("react-native");
const ModalContext_1 = require("./ModalContext");
const Portal_1 = require("./Portal");
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
                component: children,
                animationType,
                presentationStyle,
                transparent,
                viewProps,
                uniqueId: newId,
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
    if (currentModalId &&
        visible &&
        process.env.EXPO_OS &&
        ['ios', 'android'].includes(process.env.EXPO_OS)) {
        return (<Portal_1.ModalPortalContent hostId={currentModalId}>
        <ModalContent {...viewProps}>{children}</ModalContent>
      </Portal_1.ModalPortalContent>);
    }
    return null;
}
function ModalContent(props) {
    const { children, style, ...viewProps } = props;
    const { setHeight, contentOffset } = (0, react_1.use)(Portal_1.PortalContentHeightContext);
    // Adding marginTop here to account for the content offset.
    // The content offset is the space above the modal.
    // We are using it, to simulate correct positioning of the modal content for React Native.
    // If this was not done, touch events would not be correctly handled on Android.
    return (<react_native_1.View {...viewProps} style={{
            top: contentOffset,
            width: '100%',
            position: 'absolute',
        }} onLayout={(e) => {
            const { height } = e.nativeEvent.layout;
            if (height) {
                setHeight(height);
            }
        }}>
      {children}
    </react_native_1.View>);
}
//# sourceMappingURL=Modal.js.map