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
exports.ServerContainer = void 0;
const React = __importStar(require("react"));
const core_1 = require("../core");
const ServerContext_1 = require("./ServerContext");
/**
 * Container component for server rendering.
 *
 * @param props.location Location object to base the initial URL for SSR.
 * @param props.children Child elements to render the content.
 * @param props.ref Ref object which contains helper methods.
 */
exports.ServerContainer = React.forwardRef(function ServerContainer({ children, location }, ref) {
    React.useEffect(() => {
        console.error("'ServerContainer' should only be used on the server with 'react-dom/server' for SSR.");
    }, []);
    const current = {};
    if (ref) {
        const value = {
            getCurrentOptions() {
                return current.options;
            },
        };
        // We write to the `ref` during render instead of `React.useImperativeHandle`
        // This is because `useImperativeHandle` will update the ref after 'commit',
        // and there's no 'commit' phase during SSR.
        // Mutating ref during render is unsafe in concurrent mode, but we don't care about it for SSR.
        if (typeof ref === 'function') {
            ref(value);
        }
        else {
            ref.current = value;
        }
    }
    return (<ServerContext_1.ServerContext.Provider value={{ location }}>
      <core_1.CurrentRenderContext.Provider value={current}>{children}</core_1.CurrentRenderContext.Provider>
    </ServerContext_1.ServerContext.Provider>);
});
//# sourceMappingURL=ServerContainer.js.map