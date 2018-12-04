// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UserNotifications/UserNotifications.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUserNotificationCenter : NSObject

+ (instancetype)sharedInstance;

- (void)requestAuthorizationWithOptions:(UNAuthorizationOptions)options completionHandler:(void (^)(BOOL granted, NSError *__nullable error))completionHandler;

- (void)setNotificationCategories:(NSSet<UNNotificationCategory *> *)categories;
- (void)getNotificationCategoriesWithCompletionHandler:(void(^)(NSSet<UNNotificationCategory *> *categories))completionHandler;

- (void)getNotificationSettingsWithCompletionHandler:(void(^)(UNNotificationSettings *settings))completionHandler;

- (void)addNotificationRequest:(UNNotificationRequest *)request withCompletionHandler:(nullable void(^)(NSError *__nullable error))completionHandler;

- (void)getPendingNotificationRequestsWithCompletionHandler:(void(^)(NSArray<UNNotificationRequest *> *requests))completionHandler;
- (void)removePendingNotificationRequestsWithIdentifiers:(NSArray<NSString *> *)identifiers;
- (void)removeAllPendingNotificationRequests;

@end

NS_ASSUME_NONNULL_END
