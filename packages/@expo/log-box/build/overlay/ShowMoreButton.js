import { jsx as _jsx } from "react/jsx-runtime";
import { SHOW_MORE_MESSAGE_LENGTH } from './Constants';
export default function ShowMoreButton({ message, collapsed, onPress, }) {
    if (message.content.length < SHOW_MORE_MESSAGE_LENGTH || !collapsed) {
        return null;
    }
    return (_jsx("button", { style: {
            color: 'var(--expo-log-color-label)',
            fontFamily: 'var(--expo-log-font-family)',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            border: 'none',
            opacity: 0.7,
            fontSize: 14,
        }, onClick: onPress, children: "... See more" }));
}
//# sourceMappingURL=ShowMoreButton.js.map