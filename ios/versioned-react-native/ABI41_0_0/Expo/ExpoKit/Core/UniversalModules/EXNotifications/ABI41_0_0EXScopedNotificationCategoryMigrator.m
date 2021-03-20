// Copyright 2021-present 650 Industries. All rights reserved.

#import "ABI41_0_0EXScopedNotificationCategoryMigrator.h"
#import "ABI41_0_0EXScopedNotificationsUtils.h"

@implementation ABI41_0_0EXScopedNotificationCategoryMigrator

+ (void)migrateLegacyScopedCategoryIdentifiersForProject:(NSString *)experienceId
{
  [ABI41_0_0EXScopedNotificationCategoryMigrator renameLegacyCategoryIdentifiersForExperience:experienceId withBlock:^(UNNotificationCategory *oldCategory) {
    NSString *unscopedLegacyCategoryId = [ABI41_0_0EXScopedNotificationsUtils unscopedLegacyCategoryIdentifierWithId:oldCategory.identifier forExperience:experienceId];
    NSString *newCategoryId = [ABI41_0_0EXScopedNotificationsUtils scopedIdentifierFromId:unscopedLegacyCategoryId
                                                                   forExperience:experienceId];
    UNNotificationCategory *newCategory = [ABI41_0_0EXScopedNotificationCategoryMigrator createNewCategoryFrom:oldCategory withNewIdentifier:newCategoryId];
    return newCategory;
  }];
}

+ (void)unscopeLegacyCategoryIdentifiersForProject:(NSString *)experienceId
{
  [ABI41_0_0EXScopedNotificationCategoryMigrator renameLegacyCategoryIdentifiersForExperience:experienceId withBlock:^(UNNotificationCategory *oldCategory) {
    NSString *unscopedCategoryId = [ABI41_0_0EXScopedNotificationsUtils unscopedLegacyCategoryIdentifierWithId:oldCategory.identifier forExperience:experienceId];
    UNNotificationCategory *newCategory = [ABI41_0_0EXScopedNotificationCategoryMigrator createNewCategoryFrom:oldCategory withNewIdentifier:unscopedCategoryId];
    return newCategory;
  }];
}

+ (void)renameLegacyCategoryIdentifiersForExperience:(NSString *)experienceId withBlock:(UNNotificationCategory *(^)(UNNotificationCategory *category))renameCategoryBlock
{
  [[UNUserNotificationCenter currentNotificationCenter] getNotificationCategoriesWithCompletionHandler:^(NSSet<UNNotificationCategory *> *categories) {
    NSMutableSet<UNNotificationCategory *> *newCategories = [categories mutableCopy];
    BOOL didChangeCategories = NO;
    for (UNNotificationCategory *previousCategory in categories) {
      if ([ABI41_0_0EXScopedNotificationsUtils isLegacyCategoryId:previousCategory.identifier scopedByExperience:experienceId]) {
        UNNotificationCategory *newCategory = renameCategoryBlock(previousCategory);
        [newCategories removeObject:previousCategory];
        [newCategories addObject:newCategory];
        didChangeCategories = YES;
      }
    }
    if (didChangeCategories) {
      [[UNUserNotificationCenter currentNotificationCenter] setNotificationCategories:newCategories];
    }
  }];
}

+ (UNNotificationCategory *)createNewCategoryFrom:(UNNotificationCategory *)originalCategory withNewIdentifier:(NSString *)newCategoryId
{
  if (@available(iOS 12, *)) {
    return [UNNotificationCategory categoryWithIdentifier:newCategoryId
                                                  actions:originalCategory.actions
                                        intentIdentifiers:originalCategory.intentIdentifiers
                            hiddenPreviewsBodyPlaceholder:originalCategory.hiddenPreviewsBodyPlaceholder
                                    categorySummaryFormat:originalCategory.categorySummaryFormat
                                                  options:originalCategory.options];
  } else if (@available(iOS 11, *)) {
    return [UNNotificationCategory categoryWithIdentifier:newCategoryId
                                                  actions:originalCategory.actions
                                        intentIdentifiers:originalCategory.intentIdentifiers
                            hiddenPreviewsBodyPlaceholder:originalCategory.hiddenPreviewsBodyPlaceholder
                                                  options:originalCategory.options];
  } else {
    return [UNNotificationCategory categoryWithIdentifier:newCategoryId
                                                  actions:originalCategory.actions
                                        intentIdentifiers:originalCategory.intentIdentifiers
                                                  options:originalCategory.options];
  }
}

@end
