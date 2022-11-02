// Copyright 2021-present 650 Industries. All rights reserved.

#import <ABI47_0_0EXNotifications/ABI47_0_0EXNotificationsDelegate.h>
#import <ABI47_0_0EXNotifications/ABI47_0_0EXNotificationCategoriesModule.h>

@interface ABI47_0_0EXScopedNotificationCategoryMigrator : NSObject <ABI47_0_0EXNotificationsDelegate>

+ (void)unscopeLegacyCategoryIdentifiersForProjectWithScopeKey:(NSString *)scopeKey;
+ (void)migrateLegacyScopedCategoryIdentifiersForProjectWithScopeKey:(NSString *)scopeKey;

@end
