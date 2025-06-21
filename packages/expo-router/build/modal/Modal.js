"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Modal = Modal;
const non_secure_1 = require("nanoid/non-secure");
const react_1 = require("react");
const ModalContext_1 = require("./ModalContext");
const useNavigation_1 = require("../useNavigation");
function Modal({ children, visible, onClose }) {
    const { openModal, closeModal, addEventListener } = (0, ModalContext_1.useModalContext)();
    const [currentModalId, setCurrentModalId] = (0, react_1.useState)();
    const navigation = (0, useNavigation_1.useNavigation)();
    (0, react_1.useEffect)(() => {
        if (visible) {
            const newId = (0, non_secure_1.nanoid)();
            openModal({
                component: children,
                uniqueId: newId,
                parentNavigationProp: navigation,
            });
            setCurrentModalId(newId);
        }
        else {
            if (currentModalId) {
                closeModal(currentModalId);
            }
        }
        return () => { };
    }, [visible]);
    (0, react_1.useEffect)(() => {
        if (currentModalId) {
            return addEventListener('close', (id) => {
                if (id === currentModalId) {
                    onClose?.();
                    setCurrentModalId(undefined);
                }
            });
        }
        return () => { };
    }, [currentModalId, addEventListener, onClose]);
    return null;
}
//# sourceMappingURL=Modal.js.map