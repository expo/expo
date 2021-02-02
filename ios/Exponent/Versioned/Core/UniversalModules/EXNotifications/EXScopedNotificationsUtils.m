// Copyright 2018-present 650 Industries. All rights reserved.

#import "EXScopedNotificationsUtils.h"

@implementation EXScopedNotificationsUtils

+ (BOOL)shouldNotificationRequest:(UNNotificationRequest *)request beHandledByExperience:(NSString *)experienceId
{
  NSString *notificationExperienceId = request.content.userInfo[@"experienceId"];
  if (!notificationExperienceId) {
    return true;
  }
  return [notificationExperienceId isEqual:experienceId];
}

+ (BOOL)shouldNotification:(UNNotification *)notification beHandledByExperience:(NSString *)experienceId
{
  return [EXScopedNotificationsUtils shouldNotificationRequest:notification.request beHandledByExperience:experienceId];
}

+ (NSString *)scopedCategoryIdentifierWithId:(NSString *)categoryId forExperience:(NSString *)experienceId
{
  NSString *escapedExperienceId = [EXScopedNotificationsUtils escapedString: experienceId];
  NSString *escapedCategoryId = [EXScopedNotificationsUtils escapedString:categoryId];
  return [NSString stringWithFormat:@"%@/%@", escapedExperienceId, escapedCategoryId];
}

+ (NSString *)unscopedCategoryIdentifierWithId:(NSString *)scopedCategoryId forExperience:(NSString *)experienceId
{
  NSString* scopingPrefix = [NSString stringWithFormat:@"%@/", [EXScopedNotificationsUtils escapedString:experienceId]];
  NSString* unscopedEscapedCategoryId = [scopedCategoryId stringByReplacingOccurrencesOfString:scopingPrefix
                                                                                    withString:@""];
  // We are certain that this string was already percent encoded
  return [unscopedEscapedCategoryId stringByRemovingPercentEncoding];
}

+ (NSString *)escapedString:(NSString*)string
{
  NSString *charactersToEscape = @"!*'();:@&=+$,/?%#[]";
  NSCharacterSet *allowedCharacters = [[NSCharacterSet characterSetWithCharactersInString:charactersToEscape] invertedSet];
  return [string stringByAddingPercentEncodingWithAllowedCharacters:allowedCharacters];
}

// legacy categories were stored under an unescaped experienceId
+ (NSString *)unscopedLegacyCategoryIdentifierWithId:(NSString *) scopedCategoryId
                                       forExperience:(NSString *) experienceId
{
  NSString* legacyScopingPrefix = [NSString stringWithFormat:@"%@-", experienceId];
  return [scopedCategoryId stringByReplacingOccurrencesOfString:legacyScopingPrefix withString:@""];
}

@end
