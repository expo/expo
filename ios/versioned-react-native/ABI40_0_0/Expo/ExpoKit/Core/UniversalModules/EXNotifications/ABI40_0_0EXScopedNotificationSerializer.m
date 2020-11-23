// Copyright 2018-present 650 Industries. All rights reserved.

#import "ABI40_0_0EXScopedNotificationSerializer.h"

NS_ASSUME_NONNULL_BEGIN

@implementation ABI40_0_0EXScopedNotificationSerializer

+ (NSDictionary *)serializedNotificationResponse:(UNNotificationResponse *)response
{
  NSDictionary *serializedResponse = [super serializedNotificationResponse:response];
  NSMutableDictionary *serializedResponseMutable = [serializedResponse mutableCopy];
  serializedResponseMutable[@"notification"] = [self serializedNotification:response.notification];

  return [serializedResponseMutable copy];
}

+ (NSDictionary *)serializedNotification:(UNNotification *)notification
{
  NSDictionary *serializedNotification = [super serializedNotification:notification];
  NSMutableDictionary *serializedNotificationMutable = [serializedNotification mutableCopy];
  serializedNotificationMutable[@"request"] = [self serializedNotificationRequest:notification.request];
  
  return [serializedNotificationMutable copy];
}

+ (NSDictionary *)serializedNotificationContent:(UNNotificationRequest *)request
{
  NSDictionary *serializedContent = [super serializedNotificationContent:request];
  NSMutableDictionary *serializedContentMutable = [serializedContent mutableCopy];
  serializedContentMutable[@"categoryIdentifier"] = request.content.categoryIdentifier ? [self removeCategoryIdentifierPrefix: request.content.categoryIdentifier userInfo:request.content.userInfo] : [NSNull null];

  return [serializedContentMutable copy];
}

+ (NSString *)removeCategoryIdentifierPrefix:(NSString *)identifier userInfo:(NSDictionary *)userInfo
{
  NSString *experienceId = userInfo[@"experienceId"] ?: [NSNull null];
  if (experienceId) {
    NSString *scopedCategoryPrefix = [NSString stringWithFormat:@"%@-", experienceId];
    return [identifier stringByReplacingOccurrencesOfString:scopedCategoryPrefix withString:@""];
  }
  return identifier;
}

@end

NS_ASSUME_NONNULL_END
