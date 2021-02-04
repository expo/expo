// Copyright 2018-present 650 Industries. All rights reserved.

#import <UserNotifications/UserNotifications.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXScopedNotificationsUtils : NSObject

+ (BOOL)shouldNotificationRequest:(UNNotificationRequest *)request beHandledByExperience:(NSString *)experienceId;

+ (BOOL)shouldNotification:(UNNotification *)notification beHandledByExperience:(NSString *)experienceId;

+ (NSString *)scopedCategoryIdentifierWithId:(NSString *)categoryId forExperience:(NSString *)experienceId;

+ (NSString *)unscopedCategoryIdentifierWithId:(NSString *)scopedCategoryId forExperience:(NSString *)experienceId;

+ (NSString *)escapedString:(NSString*)string;

+ (NSString *)unscopedLegacyCategoryIdentifierWithId:(NSString *) scopedCategoryId forExperience:(NSString *) experienceId;

@end

NS_ASSUME_NONNULL_END
