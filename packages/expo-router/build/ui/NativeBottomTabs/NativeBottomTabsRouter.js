"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeBottomTabsRouter = NativeBottomTabsRouter;
const native_1 = require("@react-navigation/native");
function NativeBottomTabsRouter(options) {
    const tabRouter = (0, native_1.TabRouter)(options);
    const nativeTabRouter = {
        ...tabRouter,
    };
    return nativeTabRouter;
}
//# sourceMappingURL=NativeBottomTabsRouter.js.map