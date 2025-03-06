"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Head = void 0;
const react_1 = __importDefault(require("react"));
const lib_1 = require("../../vendor/react-helmet-async/lib");
const Head = ({ children }) => {
    return <lib_1.Helmet>{children}</lib_1.Helmet>;
};
exports.Head = Head;
exports.Head.Provider = lib_1.HelmetProvider;
//# sourceMappingURL=ExpoHead.js.map