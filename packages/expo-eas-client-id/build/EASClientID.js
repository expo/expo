import { NativeModulesProxy } from 'expo-modules-core';
const { EASClientID } = NativeModulesProxy;
export const getClientIDAsync = async () => {
    return await EASClientID.getClientIDAsync();
};
//# sourceMappingURL=EASClientID.js.map