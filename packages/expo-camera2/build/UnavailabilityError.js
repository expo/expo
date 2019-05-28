import { Platform } from 'react-native';
export default class UnavailabilityError extends Error {
    constructor(moduleName, propertyName) {
        super(`The method or property ${moduleName}.${propertyName} is not available on ${Platform.OS}, are you sure you've linked all the native dependencies properly?`);
        this.code = 'ERR_UNAVAILABLE';
    }
}
//# sourceMappingURL=UnavailabilityError.js.map