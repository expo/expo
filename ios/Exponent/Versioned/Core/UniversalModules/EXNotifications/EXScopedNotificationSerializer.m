// Copyright 2018-present 650 Industries. All rights reserved.

#import "EXScopedNotificationSerializer.h"

NS_ASSUME_NONNULL_BEGIN

@implementation EXScopedNotificationSerializer

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

+ (NSDictionary *)serializedNotificationRequest:(UNNotificationRequest *)request
{
  NSDictionary *serializedRequest = [super serializedNotificationRequest:request];
  NSMutableDictionary *serializedRequestMutable = [serializedRequest mutableCopy];
  serializedRequestMutable[@"content"] = [self serializedNotificationContent:request.content isRemote:[request.trigger isKindOfClass:[UNPushNotificationTrigger class]]];
  
  return [serializedRequestMutable copy];
}

+ (NSDictionary *)serializedNotificationContent:(UNNotificationContent *)content isRemote:(BOOL)isRemote
{
  NSDictionary *serializedContent = [super serializedNotificationContent:content isRemote:isRemote];
  NSMutableDictionary *serializedContentMutable = [serializedContent mutableCopy];
  serializedContentMutable[@"categoryIdentifier"] = content.categoryIdentifier ? [self removeCategoryIdentifierPrefix: content.categoryIdentifier userInfo:content.userInfo] : [NSNull null];

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
