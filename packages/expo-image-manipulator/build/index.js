import { NativeModulesProxy } from 'expo-core';
const { ExpoImageManipulator } = NativeModulesProxy;
;
export async function manipulateAsync(uri, actions = [], saveOptions = { format: 'jpeg' }) {
    if (!(typeof uri === 'string')) {
        throw new TypeError('The "uri" argument must be a string');
    }
    return await ExpoImageManipulator.manipulateAsync(uri, actions, saveOptions);
}
//# sourceMappingURL=index.js.map