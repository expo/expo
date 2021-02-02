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
  NSString *escapedExperienceId = [EXScopedNotificationsUtils escapedString:experienceId];
  NSString *escapedCategoryId = [EXScopedNotificationsUtils escapedString:categoryId];
  return [NSString stringWithFormat:@"%@/%@", escapedExperienceId, escapedCategoryId];
}

+ (NSString *)unscopedCategoryIdentifierWithId:(NSString *)scopedCategoryId forExperience:(NSString *)experienceId
{
  NSString* scopingPrefix = [NSString stringWithFormat:@"%@/", [EXScopedNotificationsUtils escapedString:experienceId]];
  NSString* unscopedEscapedCategoryId = [scopedCategoryId stringByReplacingOccurrencesOfString:scopingPrefix
                                                                                    withString:@""];
  return [EXScopedNotificationsUtils unescapedString:unscopedEscapedCategoryId];
}

+ (NSString *)escapedString:(NSString*)string
{
  return [NSRegularExpression escapedPatternForString:string];
}

+ (NSString *)unescapedString:(NSString*)string
{
  NSMutableString* mutableString = [string mutableCopy];
  NSSet *escapedCharacters = [NSSet setWithArray:@[@"*",@"?",@"+",@"[",@"(",@")",@"{",@"}",@"^",@"$",@"|",@"\\",@".",@"/"]];
  for (NSString *character in escapedCharacters) {
    mutableString = [[mutableString stringByReplacingOccurrencesOfString: [NSString stringWithFormat:@"\\%@", character] withString:character] mutableCopy];
  }
  return mutableString;
}

// legacy categories were stored under an unescaped experienceId
+ (NSString *)unscopedLegacyCategoryIdentifierWithId:(NSString *) scopedCategoryId
                                       forExperience:(NSString *) experienceId
{
  NSString* legacyScopingPrefix = [NSString stringWithFormat:@"%@-", experienceId];
  return [scopedCategoryId stringByReplacingOccurrencesOfString:legacyScopingPrefix withString:@""];
}

@end
