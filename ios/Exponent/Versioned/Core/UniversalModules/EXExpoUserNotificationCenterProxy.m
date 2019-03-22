//  Copyright © 2018-present 650 Industries. All rights reserved.

#import "EXExpoUserNotificationCenterProxy.h"

@interface EXExpoUserNotificationCenterProxy ()

@property (nonatomic, weak) id<UMUserNotificationCenterProxyInterface> userNotificationCenter;

@end

@implementation EXExpoUserNotificationCenterProxy

- (instancetype)initWithUserNotificationCenter:(id<UMUserNotificationCenterProxyInterface>)userNotificationCenter
{
  if (self = [super init]) {
    _userNotificationCenter = userNotificationCenter;
  }
  return self;
}

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(UMUserNotificationCenterProxyInterface)];
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
