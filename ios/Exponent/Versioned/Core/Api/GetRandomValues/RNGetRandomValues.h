#if __has_include("RCTBridgeModule.h")
#import "RCTBridgeModule.h"
#else
#import <React/RCTBridgeModule.h>
#endif

@interface RNGetRandomValues : NSObject <RCTBridgeModule>
-(NSString*)getRandomBase64:(NSUInteger)byteLength;
@end
