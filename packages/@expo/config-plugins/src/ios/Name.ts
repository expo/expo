import * as AppleImpl from '../apple/Name';

export const withDisplayName = AppleImpl.withDisplayName('ios');

export const withName = AppleImpl.withName('ios');

/** Set the PRODUCT_NAME variable in the xcproj file based on the app.json name property. */
export const withProductName = AppleImpl.withProductName('ios');

export { getName, setDisplayName, setName, setProductName } from '../apple/Name';
