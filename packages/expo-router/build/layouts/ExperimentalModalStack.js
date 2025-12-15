"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const StackClient_1 = require("./StackClient");
const ModalStack_1 = require("../modal/web/ModalStack");
const Protected_1 = require("../views/Protected");
const Screen_1 = require("../views/Screen");
// The RouterModal already includes Screen and Protected via withLayoutContext
// but we need to ensure we forward the stackRouterOverride for singular routes etc.
exports.default = Object.assign((props) => {
    return <ModalStack_1.RouterModal {...props} UNSTABLE_router={StackClient_1.stackRouterOverride}/>;
}, {
    Screen: Screen_1.Screen,
    Protected: Protected_1.Protected,
});
//# sourceMappingURL=ExperimentalModalStack.js.map