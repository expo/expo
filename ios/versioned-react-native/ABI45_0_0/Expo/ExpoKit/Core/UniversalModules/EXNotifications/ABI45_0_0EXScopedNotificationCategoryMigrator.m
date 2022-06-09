// Copyright 2021-present 650 Industries. All rights reserved.

#import "ABI45_0_0EXScopedNotificationCategoryMigrator.h"
#import "ABI45_0_0EXScopedNotificationsUtils.h"

@implementation ABI45_0_0EXScopedNotificationCategoryMigrator

+ (void)migrateLegacyScopedCategoryIdentifiersForProjectWithScopeKey:(NSString *)scopeKey
{
  [ABI45_0_0EXScopedNotificationCategoryMigrator renameLegacyCategoryIdentifiersForExperienceWithScopeKey:scopeKey withBlock:^(UNNotificationCategory *oldCategory) {
    NSString *unscopedLegacyCategoryId = [ABI45_0_0EXScopedNotificationsUtils unscopedLegacyCategoryIdentifierWithId:oldCategory.identifier forScopeKey:scopeKey];
    NSString *newCategoryId = [ABI45_0_0EXScopedNotificationsUtils scopedIdentifierFromId:unscopedLegacyCategoryId
                                                                   forExperience:scopeKey];
    UNNotificationCategory *newCategory = [ABI45_0_0EXScopedNotificationCategoryMigrator createNewCategoryFrom:oldCategory withNewIdentifier:newCategoryId];
    return newCategory;
  }];
}

+ (void)unscopeLegacyCategoryIdentifiersForProjectWithScopeKey:(NSString *)scopeKey
{
  [ABI45_0_0EXScopedNotificationCategoryMigrator renameLegacyCategoryIdentifiersForExperienceWithScopeKey:scopeKey withBlock:^(UNNotificationCategory *oldCategory) {
    NSString *unscopedCategoryId = [ABI45_0_0EXScopedNotificationsUtils unscopedLegacyCategoryIdentifierWithId:oldCategory.identifier forScopeKey:scopeKey];
    UNNotificationCategory *newCategory = [ABI45_0_0EXScopedNotificationCategoryMigrator createNewCategoryFrom:oldCategory withNewIdentifier:unscopedCategoryId];
    return newCategory;
  }];
}

+ (void)renameLegacyCategoryIdentifiersForExperienceWithScopeKey:(NSString *)scopeKey withBlock:(UNNotificationCategory *(^)(UNNotificationCategory *category))renameCategoryBlock
{
  [[UNUserNotificationCenter currentNotificationCenter] getNotificationCategoriesWithCompletionHandler:^(NSSet<UNNotificationCategory *> *categories) {
    NSMutableSet<UNNotificationCategory *> *newCategories = [categories mutableCopy];
    BOOL didChangeCategories = NO;
    for (UNNotificationCategory *previousCategory in categories) {
      if ([ABI45_0_0EXScopedNotificationsUtils isLegacyCategoryId:previousCategory.identifier scopedByScopeKey:scopeKey]) {
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
