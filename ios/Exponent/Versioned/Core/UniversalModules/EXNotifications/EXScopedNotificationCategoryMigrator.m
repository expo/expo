// Copyright 2021-present 650 Industries. All rights reserved.

#import "EXScopedNotificationCategoryMigrator.h"
#import "EXScopedNotificationsUtils.h"

@implementation EXScopedNotificationCategoryMigrator

+ (void)migrateCategoriesToNewScopingPrefix:(NSString *)experienceId
{
  NSString *prefixToReplace = [NSString stringWithFormat:@"^%@-", experienceId];
  NSString *escapedExperienceId = [EXScopedNotificationsUtils escapedString:experienceId];
  NSString *newScopingPrefix = [NSString stringWithFormat:@"%@/", escapedExperienceId];
  [EXScopedNotificationCategoryMigrator replaceAllCategoryIdPrefixesMatching:prefixToReplace
                                                                          withString:newScopingPrefix
                                                                       forExperience:experienceId];
}

+ (void)migrateCategoriesToUnscopedIdentifiers:(NSString *)experienceId
{
  NSString *prefixToReplace = [NSString stringWithFormat:@"^%@-", experienceId];
  [EXScopedNotificationCategoryMigrator replaceAllCategoryIdPrefixesMatching:prefixToReplace
                                                                          withString:@""
                                                                       forExperience:experienceId];
}

+ (void)replaceAllCategoryIdPrefixesMatching:(NSString *)pattern
                                  withString:(NSString *)newPrefix
                               forExperience:(NSString *)experienceId
{
  [[UNUserNotificationCenter currentNotificationCenter] getNotificationCategoriesWithCompletionHandler:^(NSSet<UNNotificationCategory *> *categories) {
    NSMutableSet<UNNotificationCategory *> *newCategories = [categories mutableCopy];
    NSError *error = nil;
    BOOL didChangeCategories = NO;
    NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:pattern options:NSRegularExpressionCaseInsensitive error:&error];
    for (UNNotificationCategory *previousCategory in categories) {
      if ([regex firstMatchInString:previousCategory.identifier options:0 range:NSMakeRange(0, [previousCategory.identifier length])]) {
        // Serialized categories do not contain the scoping prefix
        NSMutableDictionary *serializedCategory = [self serializeLegacyCategory:previousCategory
                                                               withExperienceId:experienceId];
        NSString *newCategoryId = [NSString stringWithFormat: @"%@%@", newPrefix, serializedCategory[@"identifier"]];
        UNNotificationCategory *newCategory = [EXNotificationCategoriesModule createCategoryWithId:newCategoryId
                                                                                           actions:serializedCategory[@"actions"]
                                                                                           options:serializedCategory[@"options"]];
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
