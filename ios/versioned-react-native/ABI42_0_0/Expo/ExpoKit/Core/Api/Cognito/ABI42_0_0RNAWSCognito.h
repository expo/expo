/**
 NOTE: the imports are slightly changed by hand for expo versioning.
 since cognito sdk does not change frequently, these changes do not include in `update-vendored-module` script and you should update manually after upgrading the module.
 changes we did:
   - replace imports from double-quote "" to bracket <> for xcode to find the correct versioning headers and clang modules.
 */

#import <ABI42_0_0React/ABI42_0_0RCTBridgeModule.h>
#import <ABI42_0_0React/ABI42_0_0RCTLog.h>
#import <ABI42_0_0React/ABI42_0_0RCTUtils.h>

#import <JKBigInteger.h>

@interface ABI42_0_0RNAWSCognito : NSObject <ABI42_0_0RCTBridgeModule>

@end
