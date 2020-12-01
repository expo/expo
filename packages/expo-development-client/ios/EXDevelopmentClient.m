#import "EXDevelopmentClient.h"

#import "EXDevelopmentClientController+Private.h"
#import <React/RCTBridge.h>


@implementation EXDevelopmentClient

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup {
  return NO;
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
