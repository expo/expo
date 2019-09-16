import { NativeModulesProxy } from '@unimodules/core';
export default NativeModulesProxy.ExpoAppleAuthentication ||
    {
        isAvailableAsync() {
            return Promise.resolve(false);
        },
    };
//# sourceMappingURL=ExpoAppleAuthentication.js.map