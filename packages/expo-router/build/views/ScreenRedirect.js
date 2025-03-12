"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScreenRedirect = void 0;
const hooks_1 = require("../hooks");
const useFocusEffect_1 = require("../useFocusEffect");
function ScreenRedirect({ href, relativeToDirectory, withAnchor }) {
    const router = (0, hooks_1.useRouter)();
    (0, useFocusEffect_1.useFocusEffect)(() => {
        try {
            router.replace(href, { relativeToDirectory, withAnchor });
        }
        catch (error) {
            console.error(error);
        }
    });
    return null;
}
exports.ScreenRedirect = ScreenRedirect;
//# sourceMappingURL=ScreenRedirect.js.map