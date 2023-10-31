"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformFromAstSync = exports.parseSync = void 0;
// re-exported because babel/core is hard to mock.
var core_1 = require("@babel/core");
Object.defineProperty(exports, "parseSync", { enumerable: true, get: function () { return core_1.parseSync; } });
Object.defineProperty(exports, "transformFromAstSync", { enumerable: true, get: function () { return core_1.transformFromAstSync; } });
