import * as AppleImpl from '../apple/Swift';

export const withSwiftBridgingHeader = AppleImpl.withSwiftBridgingHeader('ios');
export const ensureSwiftBridgingHeaderSetup = AppleImpl.ensureSwiftBridgingHeaderSetup('ios');
export const createBridgingHeaderFile = AppleImpl.createBridgingHeaderFile('ios');
export const withNoopSwiftFile = AppleImpl.withNoopSwiftFile('ios');

export { getDesignatedSwiftBridgingHeaderFileReference, linkBridgingHeaderFile } from '../apple/Swift';