#if __has_include("ABI43_0_0RCTBridgeModule.h")
#import "ABI43_0_0RCTBridgeModule.h"
#else
#import <ABI43_0_0React/ABI43_0_0RCTBridgeModule.h>
#endif

#if __has_include("ABI43_0_0RCTLog.h")
#import "ABI43_0_0RCTLog.h"
#else
#import <ABI43_0_0React/ABI43_0_0RCTLog.h>
#endif

#if __has_include("ABI43_0_0RCTUtils.h")
#import "ABI43_0_0RCTUtils.h"
#else
#import <ABI43_0_0React/ABI43_0_0RCTUtils.h>
#endif
// Must use brackets instead of quotes for importing JKBigInteger otherwise this is broken by versioning
#import <JKBigInteger.h>

@interface ABI43_0_0RNAWSCognito : NSObject <ABI43_0_0RCTBridgeModule>
-(NSString*)getRandomBase64:(NSUInteger)byteLength;
@end
