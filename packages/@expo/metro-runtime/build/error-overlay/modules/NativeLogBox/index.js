import React from 'react';
import ReactDOM from 'react-dom/client';
let currentRoot = null;
export default {
    show() {
        if (currentRoot) {
            return;
        }
        const ErrorOverlay = require('../../ErrorOverlay').default;
        // Create a new div with ID `error-overlay` element and render LogBoxInspector into it.
        const div = document.createElement('div');
        div.id = 'error-overlay';
        document.body.appendChild(div);
        currentRoot = ReactDOM.createRoot(div);
        currentRoot.render(React.createElement(ErrorOverlay, null));
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