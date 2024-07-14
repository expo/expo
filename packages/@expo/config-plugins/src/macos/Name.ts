import * as AppleImpl from '../apple/Name';

export const withDisplayName = AppleImpl.withDisplayName('macos');

export const withName = AppleImpl.withName('macos');

/** Set the PRODUCT_NAME variable in the xcproj file based on the app.json name property. */
export const withProductName = AppleImpl.withProductName('macos');

export { getName, setDisplayName, setName, setProductName } from '../apple/Name';
