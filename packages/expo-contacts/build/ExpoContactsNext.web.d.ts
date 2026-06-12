import type { ContactsPermissionResponse } from './types/Permissions';
declare const _default: {
    Contact: typeof import("./types/Contact").Contact;
    getPermissionsAsync: () => Promise<ContactsPermissionResponse>;
    requestPermissionsAsync: () => Promise<ContactsPermissionResponse>;
    addListener: () => {
        remove: () => void;
    };
    removeListener: () => void;
    removeAllListeners: () => void;
    emit: () => void;
    listenerCount: () => number;
};
export default _default;
//# sourceMappingURL=ExpoContactsNext.web.d.ts.map