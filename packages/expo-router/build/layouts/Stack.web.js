"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stack = void 0;
const ModalStack_1 = require("./ModalStack");
const StackClient_1 = require("./StackClient");
const Protected_1 = require("../views/Protected");
// The RouterModal already includes Screen and Protected via withLayoutContext
// but we need to ensure we forward the stackRouterOverride for singular routes etc.
const Stack = Object.assign((props) => {
    return <ModalStack_1.RouterModal {...props} UNSTABLE_router={StackClient_1.stackRouterOverride}/>;
}, {
    Screen: ModalStack_1.RouterModal.Screen,
    Protected: Protected_1.Protected,
});
exports.Stack = Stack;
exports.default = Stack;
//# sourceMappingURL=Stack.web.js.map