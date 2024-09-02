"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDebugDescription = exports.getServerReference = exports.registerServerReferenceDEV = void 0;
// HACK: This wrapper has shared state that we can use to access the server actions lazily in development without needing
// an extra pass to generate and extract modules.
// This is used as a drop-in replacement for `react-server-dom-webpack/server` in `babel-preset-expo`, but it exposes the server
// action references so we can access them in Expo CLI.
// This module ID (`expo-router/build/server-actions`) must also be external in the Metro resolver to ensure the state is shared in development across modules.
// NOTE: Since we're running this file in Node.js directly without conditions, we need to modify the requires with babel register.
// import RSDW from 'react-server-dom-webpack/server.edge';
// Make this global to share state between rsc-renderer and expo-definedRouter. This is a HACK
function getKnownServerReferences() {
    if (!globalThis._knownServerReferences) {
        globalThis._knownServerReferences = new Map();
    }
    if (!globalThis._knownServerReferences.get(process.env.EXPO_OS)) {
        globalThis._knownServerReferences.set(process.env.EXPO_OS, new Map());
    }
    return globalThis._knownServerReferences.get(process.env.EXPO_OS);
}
function registerServerReferenceDEV(
// Function
proxy, 
// ID sent to the server from the client
reference, 
// etc. (used for forms which we don't currently support on native)
encodeFormAction) {
    const res = globalThis._REACT_registerServerReference(proxy, reference, encodeFormAction);
    getKnownServerReferences().set(reference + '#' + encodeFormAction, res);
    return res;
}
exports.registerServerReferenceDEV = registerServerReferenceDEV;
function getServerReference(reference) {
    return getKnownServerReferences().get(reference);
}
exports.getServerReference = getServerReference;
function getDebugDescription() {
    return `Known server references (instantiated: ${!!globalThis._knownServerReferences}, platform: ${process.env.EXPO_OS}): ${Array.from(getKnownServerReferences().keys()).join(', ')}`;
}
exports.getDebugDescription = getDebugDescription;
//# sourceMappingURL=server-actions.js.map