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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useThenable = void 0;
/*
 * This file is unchanged, except for moving eslint comments
 */
const React = __importStar(require("react"));
function useThenable(create) {
    const [promise] = React.useState(create);
    let initialState = [false, undefined];
    // Check if our thenable is synchronous
    promise.then((result) => {
        initialState = [true, result];
    });
    const [state, setState] = React.useState(initialState);
    const [resolved] = state;
    React.useEffect(() => {
        let cancelled = false;
        const resolve = async () => {
            let result;
            try {
                result = await promise;
            }
            finally {
                if (!cancelled) {
                    setState([true, result]);
                }
            }
        };
        if (!resolved) {
            resolve();
        }
        return () => {
            cancelled = true;
        };
    }, [promise, resolved]);
    return state;
}
exports.useThenable = useThenable;
//# sourceMappingURL=useThenable.js.map