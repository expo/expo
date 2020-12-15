#import "EXDevLauncher.h"

#import "EXDevLauncherController+Private.h"
#import <React/RCTBridge.h>

#import <expo_dev_launcher-Swift.h>

const NSString *ON_NEW_DEEP_LINK_EVENT = @"expo.modules.devlauncher.onnewdeeplink";

@implementation EXDevLauncher

RCT_EXPORT_MODULE()

- (instancetype)init {
  if (self = [super init]) {
    [[EXDevLauncherController sharedInstance].pendingDeepLinkRegistry subscribe:self];
  }
  return self;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[ON_NEW_DEEP_LINK_EVENT];
}


- (void)invalidate
{
  [[EXDevLauncherController sharedInstance].pendingDeepLinkRegistry unsubscribe:self];
}

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

- (void)onNewPendingDeepLink:(NSURL *)deepLink
{
  [self sendEventWithName:ON_NEW_DEEP_LINK_EVENT body:deepLink.absoluteString];
}

RCT_EXPORT_METHOD(getPendingDeepLink:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  resolve([EXDevLauncherController sharedInstance].pendingDeepLinkRegistry.pendingDeepLink.absoluteString);
}

RCT_EXPORT_METHOD(loadApp:(NSString *)url
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  EXDevLauncherController *controller = [EXDevLauncherController sharedInstance];
  [controller loadApp:url onSuccess:^{
    resolve(nil);
  } onError:^(NSError *error) {
    reject(@"ERR_DEV_LAUNCHER_CANNOT_LOAD_APP", error.description, error);
  }];
}

RCT_EXPORT_METHOD(getRecentlyOpenedApps:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  resolve([[EXDevLauncherController sharedInstance] recentlyOpenedApps]);
}

@end
