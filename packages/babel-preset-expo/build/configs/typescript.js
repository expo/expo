"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = getConfig;
function isTypeScriptSource(fileName) {
    return !!fileName && fileName.endsWith('.ts');
}
function isTSXSource(fileName) {
    return !!fileName && fileName.endsWith('.tsx');
}
function getConfig() {
    return {
        overrides: [
            {
                test: isTypeScriptSource,
                plugins: [
                    [
                        require('@babel/plugin-transform-typescript'),
                        {
                            isTSX: false,
                            allowNamespaces: true,
                        },
                    ],
                ],
            },
            {
                test: isTSXSource,
                plugins: [
                    [
                        require('@babel/plugin-transform-typescript'),
                        {
                            isTSX: true,
                            allowNamespaces: true,
                        },
                    ],
                ],
            },
        ],
    };
}
//# sourceMappingURL=typescript.js.map