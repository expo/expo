// Copyright 2021-present 650 Industries. All rights reserved.

#import <EXNotifications/EXNotificationsDelegate.h>
#import <EXNotifications/EXNotificationCategoriesModule.h>

@interface EXScopedNotificationCategoryMigrator : NSObject <EXNotificationsDelegate>

+ (void)unscopeLegacyCategoryIdentifiersForProject:(NSString *)experienceId;
+ (void)migrateLegacyScopedCategoryIdentifiersForProject:(NSString *)experienceId;

@end
