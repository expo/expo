// Copyright 2018-present 650 Industries. All rights reserved.

#import "ABI49_0_0EXScopedNotificationBuilder.h"
#import "ABI49_0_0EXScopedNotificationsUtils.h"

@interface ABI49_0_0EXScopedNotificationBuilder ()

@property (nonatomic, strong) NSString *scopeKey;
@property (nonatomic, assign) BOOL isInExpoGo;

@end

@implementation ABI49_0_0EXScopedNotificationBuilder

- (instancetype)initWithScopeKey:(NSString *)scopeKey
                       andConstantsBinding:(ABI49_0_0EXConstantsBinding *)constantsBinding
{
  if (self = [super init]) {
    _scopeKey = scopeKey;
    _isInExpoGo = [@"expo" isEqualToString:constantsBinding.appOwnership];
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
  
  if (content.categoryIdentifier && _isInExpoGo) {
    NSString *scopedCategoryIdentifier = [ABI49_0_0EXScopedNotificationsUtils scopedIdentifierFromId:content.categoryIdentifier
                                                                              forExperience:_scopeKey];
    [content setCategoryIdentifier:scopedCategoryIdentifier];
  }
  
  return content;
}

@end
