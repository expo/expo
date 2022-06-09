// Copyright 2021-present 650 Industries. All rights reserved.

#import <ABI45_0_0EXNotifications/ABI45_0_0EXNotificationsDelegate.h>
#import <ABI45_0_0EXNotifications/ABI45_0_0EXNotificationCategoriesModule.h>

@interface ABI45_0_0EXScopedNotificationCategoryMigrator : NSObject <ABI45_0_0EXNotificationsDelegate>

+ (void)unscopeLegacyCategoryIdentifiersForProjectWithScopeKey:(NSString *)scopeKey;
+ (void)migrateLegacyScopedCategoryIdentifiersForProjectWithScopeKey:(NSString *)scopeKey;

@end
