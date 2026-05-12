"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_DESTRUCTIVE_COLOR = exports.DEFAULT_TOOLBAR_BACKGROUND_COLOR = exports.DEFAULT_TOOLBAR_TINT_COLOR = void 0;
const color_1 = require("../../../color");
const DEFAULT_TOOLBAR_TINT_COLOR = () => color_1.Color.android.dynamic.onSurface;
exports.DEFAULT_TOOLBAR_TINT_COLOR = DEFAULT_TOOLBAR_TINT_COLOR;
const DEFAULT_TOOLBAR_BACKGROUND_COLOR = () => color_1.Color.android.dynamic.surfaceContainer;
exports.DEFAULT_TOOLBAR_BACKGROUND_COLOR = DEFAULT_TOOLBAR_BACKGROUND_COLOR;
const DEFAULT_DESTRUCTIVE_COLOR = () => color_1.Color.android.material.error;
exports.DEFAULT_DESTRUCTIVE_COLOR = DEFAULT_DESTRUCTIVE_COLOR;
//# sourceMappingURL=defaults.android.js.map