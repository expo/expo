// Copyright 2018-present 650 Industries. All rights reserved.

#import "ABI38_0_0EXScopedNotificationBuilder.h"

@interface ABI38_0_0EXScopedNotificationBuilder ()

@property (nonatomic, strong) NSString *experienceId;

@end

@implementation ABI38_0_0EXScopedNotificationBuilder

- (instancetype)initWithExperienceId:(NSString *)experienceId
{
  if (self = [super init]) {
    _experienceId = experienceId;
  }
  
  return self;
}

- (UNNotificationContent *)notificationContentFromRequest:(NSDictionary *)request
{
  UNMutableNotificationContent *content = [super notificationContentFromRequest:request];
  NSMutableDictionary *userInfo = [content.userInfo mutableCopy];
  if (!userInfo) {
    userInfo = [NSMutableDictionary dictionary];
  }
  userInfo[@"experienceId"] = _experienceId;
  [content setUserInfo:userInfo];
  return content;
}

@end
