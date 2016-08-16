@import Foundation;

#import "ABI5_0_0RCTBridgeModule.h"

@interface ABI5_0_0EXURLHandler : NSObject <ABI5_0_0RCTBridgeModule>

+ (BOOL)openInternalURL:(NSURL *)url sourceApplication:(NSString *)sourceApplication annotation:(id)annotation;

@end
