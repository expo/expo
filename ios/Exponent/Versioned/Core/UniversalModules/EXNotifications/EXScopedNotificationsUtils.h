// Copyright 2018-present 650 Industries. All rights reserved.

#import <UserNotifications/UserNotifications.h>

NS_ASSUME_NONNULL_BEGIN

typedef struct {
    NSString *scopeKey;
    NSString *categoryIdentifier;
} ScopedCategoryIdentifierComponents;

@interface EXScopedNotificationsUtils : NSObject

+ (BOOL)shouldNotificationRequest:(UNNotificationRequest *)request beHandledByExperience:(NSString *)experienceId;

+ (BOOL)shouldNotification:(UNNotification *)notification beHandledByExperience:(NSString *)experienceId;

+ (NSString *)scopedCategoryIdentifierWithId:(NSString *)categoryId forExperience:(NSString *)experienceId;

+ (BOOL)isCategoryId:(NSString *)identifier scopedByExperience:(NSString *)experienceId;

+ (ScopedCategoryIdentifierComponents)getScopeAndIdentifierFromScopedIdentifier:(NSString *)scopedIdentifier;

+ (BOOL)isLegacyCategoryId:(NSString *) scopedCategoryId scopedByExperience:(NSString *) experienceId;

+ (NSString *)unscopedLegacyCategoryIdentifierWithId:(NSString *) scopedCategoryId forExperience:(NSString *) experienceId;

@end

NS_ASSUME_NONNULL_END
