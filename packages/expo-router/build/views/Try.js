"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Try = void 0;
const react_1 = __importDefault(require("react"));
const Splash_1 = require("./Splash");
// No way to access `getDerivedStateFromError` from a functional component afaict.
class Try extends react_1.default.Component {
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