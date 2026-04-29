"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unwrapESModuleDefault = unwrapESModuleDefault;
function unwrapESModuleDefault(mod) {
    const _default = mod.__esModule === true && mod.default !== undefined ? mod.default : mod;
    return _default;
}
