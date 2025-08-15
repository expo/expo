import { ViewProps } from 'react-native';
import { type ModalConfig } from './ModalContext';
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
     * Callback that is called after modal is closed.
     * This is called when the modal is closed programmatically or when the user dismisses it.
     */
    onClose?: () => void;
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
     *
     * @default 'fitToContents'
     */
    detents?: ModalConfig['detents'];
    /**
     * Determines whether the modal should close when navigating away from the screen that opened it.
     *
     * If set to `true`, the modal will close when the user navigates to a different screen.
     *
     * If set to `false`, the modal will remain open when pushing a new screen.
     * However, it will still close when navigating back or replacing the current screen.
     */
    closeOnNavigation?: boolean;
}
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
export declare function Modal(props: ModalProps): null;
//# sourceMappingURL=Modal.d.ts.map