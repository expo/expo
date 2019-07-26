import { NativeModulesProxy } from '@unimodules/core';
const { ExpoCellular } = NativeModulesProxy;
export { default as ExpoCellularView } from './ExpoCellularView';
export async function someGreatMethodAsync(options) {
    return await ExpoCellular.someGreatMethodAsync(options);
}
//# sourceMappingURL=index.js.map