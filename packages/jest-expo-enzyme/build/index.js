"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withEnzyme = void 0;
const chalk_1 = __importDefault(require("chalk"));
function withEnzyme(preset) {
    const { snapshotSerializers = [], testEnvironmentOptions = {}, haste = { defaultPlatform: null }, setupFilesAfterEnv = [], setupFiles = [], } = preset;
    if (!haste || typeof haste.defaultPlatform !== 'string') {
        const message = chalk_1.default.red(chalk_1.default.bold(`\njest-expo-enzyme: `) +
            `The provided config must have a valid ${chalk_1.default.underline('`haste.defaultPlatform: string`')} value defined\n`);
        console.error(message);
        process.exit(1);
        return;
    }
    const isNative = ['ios', 'android'].includes(haste.defaultPlatform);
    const commonConfig = Object.assign(Object.assign({}, preset), { snapshotSerializers: [...snapshotSerializers, require.resolve('enzyme-to-json/serializer')], testEnvironmentOptions: Object.assign(Object.assign({}, testEnvironmentOptions), { enzymeAdapter: 'react16' }), testEnvironment: 'enzyme' });
    if (isNative) {
        return Object.assign(Object.assign({}, commonConfig), { setupFilesAfterEnv: [...setupFilesAfterEnv, require.resolve(`./setupEnzyme.native.js`)] });
    }
    return Object.assign(Object.assign({}, commonConfig), { setupFiles: [...setupFiles, require.resolve('jest-canvas-mock')], setupFilesAfterEnv: [...setupFilesAfterEnv, require.resolve(`./setupEnzyme.web.js`)] });
}
exports.default = withEnzyme;
exports.withEnzyme = withEnzyme;
//# sourceMappingURL=index.js.map