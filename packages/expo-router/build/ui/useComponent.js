"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useComponent = void 0;
const react_1 = require("react");
const NavigationContent = ({ render, children }) => {
    return render(children);
};
function useComponent(render) {
    const renderRef = (0, react_1.useRef)(render);
    // Normally refs shouldn't be mutated in render
    // But we return a component which will be rendered
    // So it's just for immediate consumption
    renderRef.current = render;
    (0, react_1.useEffect)(() => {
        renderRef.current = null;
    });
    return (0, react_1.useRef)((0, react_1.forwardRef)(({ children }, _ref) => {
        const render = renderRef.current;
        if (render === null) {
            throw new Error('The returned component must be rendered in the same render phase as the hook.');
        }
        return <NavigationContent render={render}>{children}</NavigationContent>;
    })).current;
}
exports.useComponent = useComponent;
//# sourceMappingURL=useComponent.js.map