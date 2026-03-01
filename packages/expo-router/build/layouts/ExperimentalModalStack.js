"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const StackClient_1 = require("./StackClient");
const stack_utils_1 = require("./stack-utils");
const ModalStack_1 = require("../modal/web/ModalStack");
const Protected_1 = require("../views/Protected");
const Screen_1 = require("../views/Screen");
exports.default = Object.assign(({ children, ...props }) => {
    const rnChildren = (0, react_1.useMemo)(() => (0, stack_utils_1.mapProtectedScreen)({ guard: true, children }).children, [children]);
    return <ModalStack_1.RouterModal {...props} UNSTABLE_router={StackClient_1.stackRouterOverride} children={rnChildren}/>;
}, {
    Screen: Screen_1.Screen,
    Protected: Protected_1.Protected,
});
//# sourceMappingURL=ExperimentalModalStack.js.map