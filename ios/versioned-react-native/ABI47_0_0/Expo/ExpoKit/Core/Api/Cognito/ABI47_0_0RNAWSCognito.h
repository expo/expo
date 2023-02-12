/**
 NOTE: the imports are slightly changed by hand for expo versioning.
 since cognito sdk does not change frequently, these changes are not included in `update-vendored-module` script. you should modify manually whenever upgrading the module.
 changes we did:
   - replace imports from double-quote "" to bracket <> for xcode to find the correct versioning headers and clang modules.
 */

#import <ABI47_0_0React/ABI47_0_0RCTBridgeModule.h>
#import <ABI47_0_0React/ABI47_0_0RCTLog.h>
#import <ABI47_0_0React/ABI47_0_0RCTUtils.h>

#import <JKBigInteger/JKBigInteger.h>

@interface ABI47_0_0RNAWSCognito : NSObject <ABI47_0_0RCTBridgeModule>
-(NSString*)getRandomBase64:(NSUInteger)byteLength;
@end
