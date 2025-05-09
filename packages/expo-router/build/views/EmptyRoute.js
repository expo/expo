"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmptyRoute = EmptyRoute;
const react_1 = __importDefault(require("react"));
const Toast_1 = require("./Toast");
const Route_1 = require("../Route");
function EmptyRoute() {
    const route = (0, Route_1.useRouteNode)();
    return (<Toast_1.ToastWrapper>
      <Toast_1.Toast warning filename={route?.contextKey}>
        Missing default export
      </Toast_1.Toast>
    </Toast_1.ToastWrapper>);
}
//# sourceMappingURL=EmptyRoute.js.map