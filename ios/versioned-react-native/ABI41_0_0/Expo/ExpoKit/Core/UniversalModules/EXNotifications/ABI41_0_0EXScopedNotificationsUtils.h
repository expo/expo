// Copyright 2018-present 650 Industries. All rights reserved.

#import <UserNotifications/UserNotifications.h>

NS_ASSUME_NONNULL_BEGIN

typedef struct {
    NSString *scopeKey;
    NSString *identifier;
} ScopedIdentifierComponents;

@interface ABI41_0_0EXScopedNotificationsUtils : NSObject

+ (BOOL)shouldNotificationRequest:(UNNotificationRequest *)request beHandledByExperience:(NSString *)experienceId;

+ (BOOL)shouldNotification:(UNNotification *)notification beHandledByExperience:(NSString *)experienceId;

+ (NSString *)scopedIdentifierFromId:(NSString *)unscopedId forExperience:(NSString *)experienceId;

+ (BOOL)isId:(NSString *)identifier scopedByExperience:(NSString *)experienceId;

+ (ScopedIdentifierComponents)getScopeAndIdentifierFromScopedIdentifier:(NSString *)scopedIdentifier;

+ (BOOL)isLegacyCategoryId:(NSString *) scopedCategoryId scopedByExperience:(NSString *) experienceId;

+ (NSString *)unscopedLegacyCategoryIdentifierWithId:(NSString *) scopedCategoryId forExperience:(NSString *) experienceId;

@end

NS_ASSUME_NONNULL_END
