"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = getConfig;
/**
 * Returns the Flow/Hermes config fragment to be composed into environment configs.
 * - `overrides`: flow-strip-types override (must precede class properties)
 * - `plugins`: hermes-parser and flow-enums plugins
 */
function getConfig(options) {
    return {
        overrides: (options.disableFlowStripTypesTransform
            ? []
            : [{ plugins: [require('@babel/plugin-transform-flow-strip-types')] }]),
        plugins: [[require('babel-plugin-transform-flow-enums')]],
    };
}
//# sourceMappingURL=flow.js.map