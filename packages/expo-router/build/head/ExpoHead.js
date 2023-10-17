"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Head = void 0;
const react_1 = __importDefault(require("react"));
const react_helmet_async_1 = require("react-helmet-async");
const Head = ({ children }) => {
    return <react_helmet_async_1.Helmet>{children}</react_helmet_async_1.Helmet>;
};
exports.Head = Head;
exports.Head.Provider = react_helmet_async_1.HelmetProvider;
//# sourceMappingURL=ExpoHead.js.map