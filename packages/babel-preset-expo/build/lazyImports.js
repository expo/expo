"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lazyImports = void 0;
/** These Expo packages may have side-effects and should not be lazily initialized. */
exports.lazyImports = new Set(['expo', 'expo-asset', 'expo-task-manager']);
