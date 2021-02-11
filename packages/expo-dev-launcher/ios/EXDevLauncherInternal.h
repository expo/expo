#import <React/RCTBridgeModule.h>
#import <React/RCTBridgeDelegate.h>
#import <React/RCTInvalidating.h>
#import <React/RCTEventEmitter.h>

#import "EXDevLauncherPendingDeepLinkListener.h"

@interface EXDevLauncherInternal : RCTEventEmitter <RCTBridgeModule, EXDevLauncherPendingDeepLinkListener, RCTInvalidating>

@end
