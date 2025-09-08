import { useRef, forwardRef, useEffect } from 'react';
const NavigationContent = ({ render, children }) => {
    return render(children);
};
export function useComponent(render) {
    const renderRef = useRef(render);
    // Normally refs shouldn't be mutated in render
    // But we return a component which will be rendered
    // So it's just for immediate consumption
    renderRef.current = render;
    useEffect(() => {
        renderRef.current = null;
    });
    return useRef(forwardRef(({ children }, _ref) => {
        const render = renderRef.current;
        if (render === null) {
            throw new Error('The returned component must be rendered in the same render phase as the hook.');
        }
        return <NavigationContent render={render}>{children}</NavigationContent>;
    })).current;
}
//# sourceMappingURL=useComponent.js.map