#import <React/RCTBridgeModule.h>
#import <React/RCTBridgeDelegate.h>
#import <React/RCTInvalidating.h>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Weverything"

#import <React/RCTEventEmitter.h>

#pragma clang diagnostic pop

#import "EXDevLauncherPendingDeepLinkListener.h"

@interface EXDevLauncherInternal : RCTEventEmitter <RCTBridgeModule, EXDevLauncherPendingDeepLinkListener, RCTInvalidating>

@end
