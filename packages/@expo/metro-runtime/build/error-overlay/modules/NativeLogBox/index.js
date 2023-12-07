"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const client_1 = __importDefault(require("react-dom/client"));
let currentRoot = null;
exports.default = {
    show() {
        if (currentRoot) {
            return;
        }
        const ErrorOverlay = require('../../ErrorOverlay').default;
        // Create a new div with ID `error-overlay` element and render LogBoxInspector into it.
        const div = document.createElement('div');
        div.id = 'error-overlay';
        document.body.appendChild(div);
        currentRoot = client_1.default.createRoot(div);
        currentRoot.render(react_1.default.createElement(ErrorOverlay, null));
    },
    hide() {
        // Remove div with ID `error-overlay`
        if (currentRoot) {
            currentRoot.unmount();
            currentRoot = null;
        }
        const div = document.getElementById('error-overlay');
        div?.remove();
    },
};
//# sourceMappingURL=index.js.map