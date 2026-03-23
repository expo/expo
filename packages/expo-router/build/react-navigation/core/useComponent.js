"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.useComponent = useComponent;
const React = __importStar(require("react"));
const NavigationContent = ({ render, children }) => {
    return render(children);
};
function useComponent(render) {
    const renderRef = React.useRef(render);
    // Normally refs shouldn't be mutated in render
    // But we return a component which will be rendered
    // So it's just for immediate consumption
    renderRef.current = render;
    React.useEffect(() => {
        renderRef.current = null;
    });
    return React.useRef(({ children }) => {
        const render = renderRef.current;
        if (render === null) {
            throw new Error('The returned component must be rendered in the same render phase as the hook.');
        }
        return <NavigationContent render={render}>{children}</NavigationContent>;
    }).current;
}
//# sourceMappingURL=useComponent.js.map