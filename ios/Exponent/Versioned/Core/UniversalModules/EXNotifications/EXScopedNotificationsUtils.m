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
  NSString *scope = [EXScopedNotificationsUtils escapedString:experienceId];
  NSString *escapedCategoryId = [EXScopedNotificationsUtils escapedString:categoryId];
  return [NSString stringWithFormat:@"%@//%@", scope, escapedCategoryId];
}

+ (BOOL)isCategoryId:(NSString *)identifier scopedByExperience:(NSString *)experienceId
{
  NSString *scopeFromCategoryId = [EXScopedNotificationsUtils getScopeAndIdentifierFromScopedIdentifier:identifier].scopeKey;
  return [scopeFromCategoryId isEqualToString:experienceId];
}

+ (ScopedCategoryIdentifierComponents)getScopeAndIdentifierFromScopedIdentifier:(NSString *)scopedIdentifier
{
  NSArray *indecesOfDelimiter = [EXScopedNotificationsUtils indecesOfDelimiterInString:scopedIdentifier];
  NSString *scope = @"";
  NSString *identifier = @"";
  if (indecesOfDelimiter == nil) {
    // No delimiter found, so no scope associated with this identifier
    identifier = scopedIdentifier;
  } else {
    scope = [scopedIdentifier substringToIndex:[indecesOfDelimiter[0] integerValue]];
    identifier = [scopedIdentifier substringFromIndex:[indecesOfDelimiter[1] integerValue] + 1];
  }
  ScopedCategoryIdentifierComponents components;
  components.scopeKey = [EXScopedNotificationsUtils unescapedString:scope];
  components.categoryIdentifier = [EXScopedNotificationsUtils unescapedString:identifier];
  return components;
}

// Returns an array where the first element is the index where the
// delimiter begins, and the second is the index where it ends.
+ (NSArray *)indecesOfDelimiterInString:(NSString *)scopedCategoryId
{
  for (NSUInteger i = 1; i < [scopedCategoryId length] - 1; i++) {
    if ([scopedCategoryId characterAtIndex:i] == '/' &&
        [scopedCategoryId characterAtIndex:i-1] == '/' &&
        [scopedCategoryId characterAtIndex:i+1] != '/'
        ) {
      return @[[NSNumber numberWithUnsignedInteger:i-1], [NSNumber numberWithUnsignedInteger:i]];
    }
  }
  return nil;
}

+ (NSString *)escapedString:(NSString*)string
{
  return [string stringByReplacingOccurrencesOfString:@"/" withString:@"\\/"];
}

+ (NSString *)unescapedString:(NSString*)string
{
  return [string stringByReplacingOccurrencesOfString:@"\\/" withString:@"/"];
}

// legacy categories were stored under an unescaped experienceId
+ (NSString *)unscopedLegacyCategoryIdentifierWithId:(NSString *) scopedCategoryId
                                       forExperience:(NSString *) experienceId
{
  NSString* legacyScopingPrefix = [NSString stringWithFormat:@"%@-", experienceId];
  return [scopedCategoryId stringByReplacingOccurrencesOfString:legacyScopingPrefix withString:@""];
}

@end
