//  Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UserNotifications/UserNotifications.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUserNotificationCenter : NSObject

+ (instancetype)sharedInstance;
- (void)requestAuthorizationWithOptions:(UNAuthorizationOptions)options completionHandler:(void (^)(BOOL granted, NSError *__nullable error))completionHandler;

// Notification categories can be used to choose which actions will be displayed on which notifications.
- (void)setNotificationCategories:(NSSet<UNNotificationCategory *> *)categories __TVOS_PROHIBITED;
- (void)getNotificationCategoriesWithCompletionHandler:(void(^)(NSSet<UNNotificationCategory *> *categories))completionHandler __TVOS_PROHIBITED;

// The application's user notification settings
- (void)getNotificationSettingsWithCompletionHandler:(void(^)(UNNotificationSettings *settings))completionHandler;

// Notification requests can be scheduled to notify the user via time and location. See UNNotificationTrigger for more information. Calling -addNotificationRequest: will replace an existing notification request with the same identifier. A notification request with the identifier as an existing delivered notifications will alert for the new notification request and replace the existing delivered notification when it is triggered. The number of pending notification requests that may be scheduled by an application at any one time is limited by the system.
- (void)addNotificationRequest:(UNNotificationRequest *)request withCompletionHandler:(nullable void(^)(NSError *__nullable error))completionHandler;

// Notification requests that are waiting for their trigger to fire
- (void)getPendingNotificationRequestsWithCompletionHandler:(void(^)(NSArray<UNNotificationRequest *> *requests))completionHandler;
- (void)removePendingNotificationRequestsWithIdentifiers:(NSArray<NSString *> *)identifiers;
- (void)removeAllPendingNotificationRequests;

@end

NS_ASSUME_NONNULL_END
