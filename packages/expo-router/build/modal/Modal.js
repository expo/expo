"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Modal = Modal;
const non_secure_1 = require("nanoid/non-secure");
const react_1 = require("react");
const ModalContext_1 = require("./ModalContext");
const useNavigation_1 = require("../useNavigation");
function Modal({ children, visible, onClose }) {
    const { modalConfig, openModal, closeModal, addEventListener } = (0, ModalContext_1.useModalContext)();
    const [currentModalId, setCurrentModalId] = (0, react_1.useState)();
    const navigation = (0, useNavigation_1.useNavigation)();
    const openModalId = modalConfig?.uniqueId;
    (0, react_1.useEffect)(() => {
        if (visible) {
            if (openModalId) {
                throw new Error('Cannot open modal inside modal');
            }
            const newId = (0, non_secure_1.nanoid)();
            openModal({
                component: children,
                uniqueId: newId,
                navigationProp: navigation,
            });
            setCurrentModalId(newId);
            if (onClose) {
                return addEventListener('close', onClose);
            }
        }
        else {
            if (openModalId && currentModalId === openModalId) {
                closeModal();
            }
        }
        return () => { };
    }, [visible]);
    return null;
}
//# sourceMappingURL=Modal.js.map