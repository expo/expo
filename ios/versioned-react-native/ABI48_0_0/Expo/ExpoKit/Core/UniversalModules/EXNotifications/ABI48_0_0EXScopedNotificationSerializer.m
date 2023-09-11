// Copyright 2018-present 650 Industries. All rights reserved.

#import "ABI48_0_0EXScopedNotificationSerializer.h"
#import "ABI48_0_0EXScopedNotificationsUtils.h"

NS_ASSUME_NONNULL_BEGIN

@implementation ABI48_0_0EXScopedNotificationSerializer

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
  serializedContentMutable[@"categoryIdentifier"] = request.content.categoryIdentifier ? [ABI48_0_0EXScopedNotificationsUtils getScopeAndIdentifierFromScopedIdentifier:request.content.categoryIdentifier].identifier : [NSNull null];
  
  return [serializedContentMutable copy];
}

+ (NSDictionary *)serializedNotificationRequest:(UNNotificationRequest *)request
{
  NSDictionary* serializedRequest = [super serializedNotificationRequest:request];
  NSMutableDictionary *serializedRequestMutable = [serializedRequest mutableCopy];
  serializedRequestMutable[@"identifier"] = [ABI48_0_0EXScopedNotificationsUtils getScopeAndIdentifierFromScopedIdentifier:request.identifier].identifier;

  return [serializedRequestMutable copy];
}

@end

NS_ASSUME_NONNULL_END
