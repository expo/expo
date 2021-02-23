// Copyright 2018-present 650 Industries. All rights reserved.

#import "ABI40_0_0EXScopedNotificationBuilder.h"

@interface ABI40_0_0EXScopedNotificationBuilder ()

@property (nonatomic, strong) NSString *experienceId;

@end

@implementation ABI40_0_0EXScopedNotificationBuilder

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
  
  if (content.categoryIdentifier) {
    NSString *categoryIdentifier = [NSString stringWithFormat:@"%@-%@", _experienceId, content.categoryIdentifier];
    [content setCategoryIdentifier:categoryIdentifier];
  }
  
  return content;
}

@end
