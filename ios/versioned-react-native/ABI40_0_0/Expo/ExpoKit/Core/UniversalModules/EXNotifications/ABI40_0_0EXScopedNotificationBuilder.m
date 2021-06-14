// Copyright 2018-present 650 Industries. All rights reserved.

#import "ABI40_0_0EXScopedNotificationBuilder.h"

@interface ABI40_0_0EXScopedNotificationBuilder ()

@property (nonatomic, strong) NSString *scopeKey;

@end

@implementation ABI40_0_0EXScopedNotificationBuilder

- (instancetype)initWithScopeKey:(NSString *)scopeKey
{
  if (self = [super init]) {
    _scopeKey = scopeKey;
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
  userInfo[@"experienceId"] = _scopeKey;
  userInfo[@"scopeKey"] = _scopeKey;
  [content setUserInfo:userInfo];

  if (content.categoryIdentifier) {
    NSString *categoryIdentifier = [NSString stringWithFormat:@"%@-%@", _scopeKey, content.categoryIdentifier];
    [content setCategoryIdentifier:categoryIdentifier];
  }

  return content;
}

@end
