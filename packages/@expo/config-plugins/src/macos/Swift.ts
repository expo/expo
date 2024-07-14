import * as AppleImpl from '../apple/Swift';

export const withSwiftBridgingHeader = AppleImpl.withSwiftBridgingHeader('macos');
export const ensureSwiftBridgingHeaderSetup = AppleImpl.ensureSwiftBridgingHeaderSetup('macos');
export const createBridgingHeaderFile = AppleImpl.createBridgingHeaderFile('macos');
export const withNoopSwiftFile = AppleImpl.withNoopSwiftFile('macos');

export {
  getDesignatedSwiftBridgingHeaderFileReference,
  linkBridgingHeaderFile,
} from '../apple/Swift';
