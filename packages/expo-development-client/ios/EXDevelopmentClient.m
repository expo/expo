#import "EXDevelopmentClient.h"

#import "EXDevelopmentClientController+Private.h"
#import <React/RCTBridge.h>

#import <expo_development_client-Swift.h>

@implementation EXDevelopmentClient

RCT_EXPORT_MODULE()

- (instancetype)init {
  if (self = [super init]) {
    [[EXDevelopmentClientController sharedInstance].pendingDeepLinkRegistry subscribe:self];
  }
  return self;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"expo.modules.developmentclient.onnewdeeplink"];
}


- (void)invalidate
{
  [[EXDevelopmentClientController sharedInstance].pendingDeepLinkRegistry unsubscribe:self];
}

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

- (void)onNewPendingDeepLink:(NSURL *)deepLink
{
  [self sendEventWithName:@"expo.modules.developmentclient.onnewdeeplink" body:deepLink.absoluteString];
}

RCT_EXPORT_METHOD(getPendingDeepLink:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  resolve([EXDevelopmentClientController sharedInstance].pendingDeepLinkRegistry.pendingDeepLink.absoluteString);
}

RCT_EXPORT_METHOD(loadApp:(NSString *)url
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  EXDevelopmentClientController *controller = [EXDevelopmentClientController sharedInstance];
  [controller loadApp:url onSuccess:^{
    resolve(nil);
  } onError:^(NSError *error) {
    reject(@"ERR_DEVELOPMENT_CLIENT_CANNOT_LOAD_APP", error.description, error);
  }];
}

RCT_EXPORT_METHOD(getRecentlyOpenedApps:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  resolve([[EXDevelopmentClientController sharedInstance] recentlyOpenedApps]);
}

@end
