#if __has_include("ABI44_0_0RCTBridgeModule.h")
#import "ABI44_0_0RCTBridgeModule.h"
#else
#import <ABI44_0_0React/ABI44_0_0RCTBridgeModule.h>
#endif

#if __has_include("ABI44_0_0RCTLog.h")
#import "ABI44_0_0RCTLog.h"
#else
#import <ABI44_0_0React/ABI44_0_0RCTLog.h>
#endif

#if __has_include("ABI44_0_0RCTUtils.h")
#import "ABI44_0_0RCTUtils.h"
#else
#import <ABI44_0_0React/ABI44_0_0RCTUtils.h>
#endif
// Must use brackets instead of quotes for importing JKBigInteger otherwise this is broken by versioning
#import <JKBigInteger.h>

@interface ABI44_0_0RNAWSCognito : NSObject <ABI44_0_0RCTBridgeModule>
-(NSString*)getRandomBase64:(NSUInteger)byteLength;
@end
