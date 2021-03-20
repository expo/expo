// Copyright 2021-present 650 Industries. All rights reserved.

#import <ABI41_0_0EXNotifications/ABI41_0_0EXNotificationsDelegate.h>
#import <ABI41_0_0EXNotifications/ABI41_0_0EXNotificationCategoriesModule.h>

@interface ABI41_0_0EXScopedNotificationCategoryMigrator : NSObject <ABI41_0_0EXNotificationsDelegate>

+ (void)unscopeLegacyCategoryIdentifiersForProject:(NSString *)experienceId;
+ (void)migrateLegacyScopedCategoryIdentifiersForProject:(NSString *)experienceId;

@end
