// Copyright 2021-present 650 Industries. All rights reserved.

#import "EXScopedNotificationCategoryMigrator.h"
#import "EXScopedNotificationsUtils.h"

@implementation EXScopedNotificationCategoryMigrator

+ (void)migrateCategoriesToNewScopingPrefix:(NSString *)experienceId
{
  NSString *prefixToReplace = [NSString stringWithFormat:@"%@-", experienceId];
  [EXScopedNotificationCategoryMigrator renameCategoryIdentifiersWithPrefix:prefixToReplace withBlock:^(UNNotificationCategory *category){
    // Serialized categories do not contain the scoping prefix
    NSMutableDictionary *serializedCategory = [self serializeLegacyCategory:category
                                                           withExperienceId:experienceId];
    NSString *newCategoryId = [EXScopedNotificationsUtils scopedCategoryIdentifierWithId:serializedCategory[@"identifier"] forExperience:experienceId];
    UNNotificationCategory *newCategory = [EXNotificationCategoriesModule createCategoryWithId:newCategoryId
                                                                                       actions:serializedCategory[@"actions"]
                                                                                       options:serializedCategory[@"options"]];
    return newCategory;
  }];
  
}

+ (void)migrateCategoriesToUnscopedIdentifiers:(NSString *)experienceId
{
  NSString *prefixToReplace = [NSString stringWithFormat:@"%@-", experienceId];
  [EXScopedNotificationCategoryMigrator renameCategoryIdentifiersWithPrefix:prefixToReplace withBlock:^(UNNotificationCategory *category){
    // Serialized categories do not contain the scoping prefix
    NSMutableDictionary *serializedCategory = [self serializeLegacyCategory:category
                                                           withExperienceId:experienceId];
    UNNotificationCategory *newCategory = [EXNotificationCategoriesModule createCategoryWithId:serializedCategory[@"identifier"]
                                                                                       actions:serializedCategory[@"actions"]
                                                                                       options:serializedCategory[@"options"]];
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

// legacy categories were stored under an unescaped experienceId
+ (NSMutableDictionary *)serializeLegacyCategory:(UNNotificationCategory *)category
                                withExperienceId:(NSString *) experienceId
{
  NSMutableDictionary* serializedCategory = [EXNotificationCategoriesModule serializeCategory:category];
  NSString* legacyScopingPrefix = [NSString stringWithFormat:@"%@-", experienceId];
  serializedCategory[@"identifier"] = [serializedCategory[@"identifier"] stringByReplacingOccurrencesOfString:legacyScopingPrefix
                                                                                                   withString:@""];
  return serializedCategory;
}

@end
