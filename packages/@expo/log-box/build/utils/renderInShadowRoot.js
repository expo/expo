"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderInShadowRoot = renderInShadowRoot;
const client_1 = __importDefault(require("react-dom/client"));
function renderInShadowRoot(id, element) {
    const div = document.createElement('div');
    div.id = id;
    // Position absolute removes element from document flow, preventing layout impact
    div.style.position = 'absolute';
    document.body.appendChild(div);
    const shadowRoot = div.attachShadow({ mode: 'open' });
    // Inject reset styles to make the portal truly inert (invisible to layout and browser inspector)
    // This is applied via JS to avoid affecting native platforms where :host becomes :root
    const resetStyle = document.createElement('style');
    resetStyle.textContent = `
    :host {
      all: initial;
      direction: ltr;
      position: absolute;
    }
  `;
    shadowRoot.appendChild(resetStyle);
    document.querySelectorAll('style').forEach((styleEl) => {
        const moduleName = styleEl.getAttribute('data-expo-css-hmr');
        const isLogBoxStyle = moduleName && moduleName.includes('expo_log_box');
        const isReactNativeStyle = styleEl.id === 'react-native-stylesheet';
        if (isLogBoxStyle || isReactNativeStyle) {
            shadowRoot.appendChild(styleEl.cloneNode(true));
        }
    });
    const shadowContainer = document.createElement('div');
    shadowRoot.appendChild(shadowContainer);
    let currentRoot = client_1.default.createRoot(shadowContainer);
    currentRoot.render(element);
    return {
        unmount: () => {
            currentRoot?.unmount();
            currentRoot = null;
            document.getElementById(id)?.remove();
        },
    };
}
//# sourceMappingURL=renderInShadowRoot.js.map