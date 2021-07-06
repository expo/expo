// Copyright 2018-present 650 Industries. All rights reserved.

#import <UserNotifications/UserNotifications.h>

NS_ASSUME_NONNULL_BEGIN

typedef struct {
    NSString *scopeKey;
    NSString *identifier;
} ScopedIdentifierComponents;

@interface EXScopedNotificationsUtils : NSObject

+ (BOOL)shouldNotificationRequest:(UNNotificationRequest *)request beHandledByExperience:(NSString *)scopeKey;

+ (BOOL)shouldNotification:(UNNotification *)notification beHandledByExperience:(NSString *)scopeKey;

+ (NSString *)scopedIdentifierFromId:(NSString *)unscopedId forExperience:(NSString *)scopeKey;

+ (BOOL)isId:(NSString *)identifier scopedByExperience:(NSString *)scopeKey;

+ (ScopedIdentifierComponents)getScopeAndIdentifierFromScopedIdentifier:(NSString *)scopedIdentifier;

+ (BOOL)isLegacyCategoryId:(NSString *)scopedCategoryId scopedByScopeKey:(NSString *)scopeKey;

+ (NSString *)unscopedLegacyCategoryIdentifierWithId:(NSString *)scopedCategoryId
                         forScopeKey:(NSString *)scopeKey;

@end

NS_ASSUME_NONNULL_END
