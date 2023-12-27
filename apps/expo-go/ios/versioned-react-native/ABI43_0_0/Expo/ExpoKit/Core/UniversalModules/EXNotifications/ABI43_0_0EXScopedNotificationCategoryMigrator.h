// Copyright 2021-present 650 Industries. All rights reserved.

#import <ABI43_0_0EXNotifications/ABI43_0_0EXNotificationsDelegate.h>
#import <ABI43_0_0EXNotifications/ABI43_0_0EXNotificationCategoriesModule.h>

@interface ABI43_0_0EXScopedNotificationCategoryMigrator : NSObject <ABI43_0_0EXNotificationsDelegate>

+ (void)unscopeLegacyCategoryIdentifiersForProjectWithScopeKey:(NSString *)scopeKey;
+ (void)migrateLegacyScopedCategoryIdentifiersForProjectWithScopeKey:(NSString *)scopeKey;

@end
