// Copyright 2021-present 650 Industries. All rights reserved.

#import "EXScopedNotificationCategoryMigrator.h"
#import "EXScopedNotificationsUtils.h"

@implementation EXScopedNotificationCategoryMigrator

+ (void)migrateLegacyScopedCategoryIdentifiersForProject:(NSString *)experienceId
{
  NSString *prefixToReplace = [NSString stringWithFormat:@"%@-", experienceId];
  [EXScopedNotificationCategoryMigrator renameCategoryIdentifiersWithPrefix:prefixToReplace withBlock:^(UNNotificationCategory *oldCategory){
    NSString *oldCategoryId = [EXScopedNotificationsUtils unscopedLegacyCategoryIdentifierWithId:oldCategory.identifier forExperience:experienceId];
    NSString *newCategoryId = [EXScopedNotificationsUtils scopedCategoryIdentifierWithId:oldCategoryId forExperience:experienceId];
    UNNotificationCategory *newCategory = [EXScopedNotificationCategoryMigrator createNewCategoryFrom:oldCategory withNewIdentifier:newCategoryId];
    return newCategory;
  }];
}

+ (void)unscopeLegacyCategoryIdentifiersForProject:(NSString *)experienceId
{
  NSString *prefixToReplace = [NSString stringWithFormat:@"%@-", experienceId];
  [EXScopedNotificationCategoryMigrator renameCategoryIdentifiersWithPrefix:prefixToReplace withBlock:^(UNNotificationCategory *oldCategory){
    NSString *unscopedCategoryId = [EXScopedNotificationsUtils unscopedLegacyCategoryIdentifierWithId:oldCategory.identifier forExperience:experienceId];
    UNNotificationCategory *newCategory = [EXScopedNotificationCategoryMigrator createNewCategoryFrom:oldCategory withNewIdentifier:unscopedCategoryId];
    return newCategory;
  }];
}

+ (void)renameCategoryIdentifiersWithPrefix:(NSString *)oldPrefix withBlock:(UNNotificationCategory *(^)(UNNotificationCategory *category))renameCategoryBlock
{
  [[UNUserNotificationCenter currentNotificationCenter] getNotificationCategoriesWithCompletionHandler:^(NSSet<UNNotificationCategory *> *categories) {
    NSMutableSet<UNNotificationCategory *> *newCategories = [categories mutableCopy];
    BOOL didChangeCategories = NO;
    for (UNNotificationCategory *previousCategory in categories) {
      if ([previousCategory.identifier containsString:oldPrefix]) {
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
