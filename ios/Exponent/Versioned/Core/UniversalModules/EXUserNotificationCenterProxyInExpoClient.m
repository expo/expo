//  Copyright © 2018-present 650 Industries. All rights reserved.

#import "EXExpoUserNotificationCenterProxy.h"
#import "EXUserNotificationCenter.h"

@implementation EXExpoUserNotificationCenterProxy

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(EXUserNotificationCenterProxyInterface)];
}

+ (instancetype)sharedInstance {
  static EXExpoUserNotificationCenterProxy * instance;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!instance) {
      instance = [[EXExpoUserNotificationCenterProxy alloc] init];
    }
  });
  return instance;
}

- (void)getNotificationSettingsWithCompletionHandler:(void(^)(UNNotificationSettings *settings))completionHandler
{
  [[EXUserNotificationCenter sharedInstance] getNotificationSettingsWithCompletionHandler:completionHandler];
}

- (void)requestAuthorizationWithOptions:(UNAuthorizationOptions)options completionHandler:(void (^)(BOOL granted, NSError *__nullable error))completionHandler
{
  [[EXUserNotificationCenter sharedInstance] requestAuthorizationWithOptions:options completionHandler:completionHandler];
}

@end
