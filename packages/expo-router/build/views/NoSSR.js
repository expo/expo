"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoSSR = NoSSR;
const react_1 = __importDefault(require("react"));
function NoSSR({ children }) {
    const [mounted, setMounted] = react_1.default.useState(false);
    react_1.default.useEffect(() => {
        setMounted(true);
    }, []);
    if (!mounted) {
        // If the component is not mounted, return null to prevent server-side rendering.
        return null;
    }
    // This component is used to prevent server-side rendering of its children.
    // It can be useful for components that rely on browser-specific APIs or
    // need to be rendered only on the client side.
    return <>{children}</>;
}
//# sourceMappingURL=NoSSR.js.map