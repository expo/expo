import { Platform } from 'react-native'

export default class UnavailabilityError extends Error {
  code = 'ERR_UNAVAILABLE'

  constructor(moduleName: string, propertyName: string) {
    super(
      `The method or property ${moduleName}.${propertyName} is not available on ${
        Platform.OS
      }, are you sure you've linked all the native dependencies properly?`
    );
  }
}
