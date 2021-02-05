// Copyright 2018-present 650 Industries. All rights reserved.

#import "EXScopedNotificationSerializer.h"
#import "EXScopedNotificationsUtils.h"

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

+ (NSDictionary *)serializedNotificationContent:(UNNotificationRequest *)request
{
  NSDictionary *serializedContent = [super serializedNotificationContent:request];
  NSMutableDictionary *serializedContentMutable = [serializedContent mutableCopy];
  serializedContentMutable[@"categoryIdentifier"] = request.content.categoryIdentifier ? [EXScopedNotificationsUtils getScopeAndIdentifierFromScopedIdentifier:request.content.categoryIdentifier].categoryIdentifier : [NSNull null];
  
  return [serializedContentMutable copy];
}

@end

NS_ASSUME_NONNULL_END
