// Copyright 2018-present 650 Industries. All rights reserved.

#import "EXScopedNotificationBuilder.h"
#import "EXScopedNotificationsUtils.h"

@interface EXScopedNotificationBuilder ()

@property (nonatomic, strong) NSString *scopeKey;
@property (nonatomic, assign) BOOL isInExpoGo;

@end

@implementation EXScopedNotificationBuilder

- (instancetype)initWithScopeKey:(NSString *)scopeKey
                       andConstantsBinding:(EXConstantsBinding *)constantsBinding
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
    NSString *scopedCategoryIdentifier = [EXScopedNotificationsUtils scopedIdentifierFromId:content.categoryIdentifier
                                                                              forExperience:_scopeKey];
    [content setCategoryIdentifier:scopedCategoryIdentifier];
  }
  
  return content;
}

@end
