// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI40_0_0EXPermissions/ABI40_0_0EXReactNativeUserNotificationCenterProxy.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMUtilities.h>

@implementation ABI40_0_0EXReactNativeUserNotificationCenterProxy

ABI40_0_0UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI40_0_0UMUserNotificationCenterProxyInterface)];
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
