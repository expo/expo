import { UnavailabilityError } from 'expo-modules-core';
export function openDatabase(name, version = '1.0', description = name, size = 1, callback) {
    const typedWindow = window;
    if ('openDatabase' in typedWindow && typedWindow.openDatabase) {
        return typedWindow.openDatabase(name, version, description, size, callback);
    }
    throw new UnavailabilityError('window', 'openDatabase');
}
//# sourceMappingURL=SQLite.web.js.map