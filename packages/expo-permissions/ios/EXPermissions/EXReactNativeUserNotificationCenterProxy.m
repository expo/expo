// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXPermissions/EXReactNativeUserNotificationCenterProxy.h>
#import <UMCore/UMUtilities.h>

@implementation EXReactNativeUserNotificationCenterProxy

UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(UMUserNotificationCenterProxyInterface)];
}

- (void)getNotificationSettingsWithCompletionHandler:(void(^)(UNNotificationSettings *settings))completionHandler
{
  [[UNUserNotificationCenter currentNotificationCenter] getNotificationSettingsWithCompletionHandler:completionHandler];
}

- (void)requestAuthorizationWithOptions:(UNAuthorizationOptions)options completionHandler:(void (^)(BOOL granted, NSError *__nullable error))completionHandler
{
  [[UNUserNotificationCenter currentNotificationCenter] requestAuthorizationWithOptions:options completionHandler:completionHandler];
}

@end
