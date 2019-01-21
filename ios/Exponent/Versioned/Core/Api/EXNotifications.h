// Copyright 2016-present 650 Industries. All rights reserved.

#import <UserNotifications/UserNotifications.h>
#import "EXScopedBridgeModule.h"
#import "EXScopedModuleRegistry.h"

NS_ASSUME_NONNULL_BEGIN

@protocol EXUserNotificationCenterService

- (void)requestAuthorizationWithOptions:(UNAuthorizationOptions)options completionHandler:(void (^)(BOOL granted, NSError *__nullable error))completionHandler;

- (void)setNotificationCategories:(NSSet<UNNotificationCategory *> *)categories;
- (void)getNotificationCategoriesWithCompletionHandler:(void(^)(NSSet<UNNotificationCategory *> *categories))completionHandler;

- (void)getNotificationSettingsWithCompletionHandler:(void(^)(UNNotificationSettings *settings))completionHandler;

- (void)addNotificationRequest:(UNNotificationRequest *)request withCompletionHandler:(nullable void(^)(NSError *__nullable error))completionHandler;

- (void)getPendingNotificationRequestsWithCompletionHandler:(void(^)(NSArray<UNNotificationRequest *> *requests))completionHandler;
- (void)removePendingNotificationRequestsWithIdentifiers:(NSArray<NSString *> *)identifiers;
- (void)removeAllPendingNotificationRequests;

@end

@protocol EXNotificationsScopedModuleDelegate

- (NSString *)apnsTokenStringForScopedModule:(id)scopedModule;
- (void)getExpoPushTokenForScopedModule:(id)scopedModule
                                success:(void (^)(NSDictionary *))success
                                failure:(void (^)(NSString *))failure DEPRECATED_MSG_ATTRIBUTE("Use -[getExpoPushTokenForScopedModule:completionHandler] instead");
- (void)getExpoPushTokenForScopedModule:(id)scopedModule
                      completionHandler:(void (^)(NSString * _Nullable pushToken, NSError * _Nullable error))handler;

@end

@protocol EXNotificationsIdentifiersManager

- (NSString *)internalIdForIdentifier:(NSString *)identifier experienceId:(NSString *)experienceId;
- (NSString *)exportedIdForInternalIdentifier:(NSString *)identifier;

@end

@interface EXNotifications : EXScopedBridgeModule

@end

NS_ASSUME_NONNULL_END
