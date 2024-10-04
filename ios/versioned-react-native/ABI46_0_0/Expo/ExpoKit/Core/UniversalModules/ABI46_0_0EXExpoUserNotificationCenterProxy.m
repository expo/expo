//  Copyright © 2018-present 650 Industries. All rights reserved.

#import "ABI46_0_0EXExpoUserNotificationCenterProxy.h"

@interface ABI46_0_0EXExpoUserNotificationCenterProxy ()

@property (nonatomic, weak) id<ABI46_0_0EXUserNotificationCenterProxyInterface> userNotificationCenter;

@end

@implementation ABI46_0_0EXExpoUserNotificationCenterProxy

- (instancetype)initWithUserNotificationCenter:(id<ABI46_0_0EXUserNotificationCenterProxyInterface>)userNotificationCenter
{
  if (self = [super init]) {
    _userNotificationCenter = userNotificationCenter;
  }
  return self;
}

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI46_0_0EXUserNotificationCenterProxyInterface)];
}

- (void)getNotificationSettingsWithCompletionHandler:(void(^)(UNNotificationSettings *settings))completionHandler
{
  [_userNotificationCenter getNotificationSettingsWithCompletionHandler:completionHandler];
}

- (void)requestAuthorizationWithOptions:(UNAuthorizationOptions)options completionHandler:(void (^)(BOOL granted, NSError *__nullable error))completionHandler
{
  [_userNotificationCenter requestAuthorizationWithOptions:options completionHandler:completionHandler];
}

@end
