// Copyright 2021-present 650 Industries. All rights reserved.

#import <EXNotifications/EXNotificationsDelegate.h>
#import <EXNotifications/EXNotificationCategoriesModule.h>

@interface EXScopedNotificationCategoryMigrator : NSObject <EXNotificationsDelegate>

+ (void)unscopeLegacyCategoryIdentifiersForProjectWithScopeKey:(NSString *)scopeKey;
+ (void)migrateLegacyScopedCategoryIdentifiersForProjectWithScopeKey:(NSString *)scopeKey;

@end
