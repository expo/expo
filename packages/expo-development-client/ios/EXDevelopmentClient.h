#import <React/RCTBridgeModule.h>
#import <React/RCTBridgeDelegate.h>
#import <React/RCTInvalidating.h>
#import <React/RCTEventEmitter.h>

#import "EXDevelopmentClientPendingDeepLinkListener.h"

@interface EXDevelopmentClient : RCTEventEmitter <RCTBridgeModule, EXDevelopmentClientPendingDeepLinkListener, RCTInvalidating>

@end
