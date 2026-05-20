"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCurrentRender = useCurrentRender;
const react_1 = require("react");
const CurrentRenderContext_1 = require("./CurrentRenderContext");
/**
 * Write the current options, so that server renderer can get current values
 * Mutating values like this is not safe in async mode, but it doesn't apply to SSR
 */
function useCurrentRender({ state, navigation, descriptors }) {
    const current = (0, react_1.use)(CurrentRenderContext_1.CurrentRenderContext);
    if (current && navigation.isFocused()) {
        current.options = descriptors[state.routes[state.index].key].options;
    }
}
//# sourceMappingURL=useCurrentRender.js.map