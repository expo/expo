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
exports.Try = void 0;
const react_1 = __importStar(require("react"));
const Splash_1 = require("./Splash");
// No way to access `getDerivedStateFromError` from a function component afaict.
class Try extends react_1.Component {
    state = { error: undefined };
    static getDerivedStateFromError(error) {
        // Force hide the splash screen if an error occurs.
        Splash_1.SplashScreen.hideAsync();
        return { error };
    }
    retry = () => {
        return new Promise((resolve) => {
            this.setState({ error: undefined }, () => {
                resolve();
            });
        });
    };
    render() {
        const { error } = this.state;
        const { catch: ErrorBoundary, children } = this.props;
        if (!error) {
            return children;
        }
        return <ErrorBoundary error={error} retry={this.retry}/>;
    }
}
exports.Try = Try;
//# sourceMappingURL=Try.js.map