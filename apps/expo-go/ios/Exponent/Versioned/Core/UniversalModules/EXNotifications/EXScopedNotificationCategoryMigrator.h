// Copyright 2021-present 650 Industries. All rights reserved.

#import <UserNotifications/UserNotifications.h>

@interface EXScopedNotificationCategoryMigrator : NSObject

+ (void)unscopeLegacyCategoryIdentifiersForProjectWithScopeKey:(NSString *)scopeKey;
+ (void)migrateLegacyScopedCategoryIdentifiersForProjectWithScopeKey:(NSString *)scopeKey;

@end
