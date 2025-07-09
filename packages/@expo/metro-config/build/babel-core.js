"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformSync = exports.transformFromAstSync = void 0;
// re-exported because babel/core is hard to mock.
var core_1 = require("@babel/core");
Object.defineProperty(exports, "transformFromAstSync", { enumerable: true, get: function () { return core_1.transformFromAstSync; } });
Object.defineProperty(exports, "transformSync", { enumerable: true, get: function () { return core_1.transformSync; } });
//# sourceMappingURL=babel-core.js.map