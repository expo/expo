/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import "ABI21_0_0RCTI18nUtil.h"

@implementation ABI21_0_0RCTI18nUtil

+ (id)sharedInstance {
   static ABI21_0_0RCTI18nUtil *sharedABI21_0_0RCTI18nUtilInstance = nil;
   @synchronized(self) {
     if (sharedABI21_0_0RCTI18nUtilInstance == nil)
      sharedABI21_0_0RCTI18nUtilInstance = [self new];
   }
   return sharedABI21_0_0RCTI18nUtilInstance;
}

/**
 * Check if the app is currently running on an RTL locale.
 * This only happens when the app:
 * - is forcing RTL layout, regardless of the active language (for development purpose)
 * - allows RTL layout when using RTL locale
 */
- (BOOL)isRTL
{
  if ([self isRTLForced]) {
    return YES;
  }
  if ([self isRTLAllowed] && [self isApplicationPreferredLanguageRTL]) {
    return YES;
  }
  return NO;
}

/**
 * Should be used very early during app start up
 * Before the bridge is initialized
 * @return whether the app allows RTL layout, default is true
 */
- (BOOL)isRTLAllowed
{
  NSNumber *value = [[NSUserDefaults standardUserDefaults] objectForKey:@"ABI21_0_0RCTI18nUtil_allowRTL"];
  if (value == nil) {
    return YES;
  }
  return [value boolValue];
}

- (void)allowRTL:(BOOL)rtlStatus
{
  [[NSUserDefaults standardUserDefaults] setBool:rtlStatus forKey:@"ABI21_0_0RCTI18nUtil_allowRTL"];
  [[NSUserDefaults standardUserDefaults] synchronize];
}

/**
 * Could be used to test RTL layout with English
 * Used for development and testing purpose
 */
- (BOOL)isRTLForced
{
  BOOL rtlStatus = [[NSUserDefaults standardUserDefaults]
                            boolForKey:@"ABI21_0_0RCTI18nUtil_forceRTL"];
  return rtlStatus;
}

- (void)forceRTL:(BOOL)rtlStatus
{
  [[NSUserDefaults standardUserDefaults] setBool:rtlStatus forKey:@"ABI21_0_0RCTI18nUtil_forceRTL"];
  [[NSUserDefaults standardUserDefaults] synchronize];
}

// Check if the current device language is RTL
- (BOOL)isDevicePreferredLanguageRTL
{
  NSLocaleLanguageDirection direction = [NSLocale characterDirectionForLanguage:[[NSLocale preferredLanguages] objectAtIndex:0]];
  return direction == NSLocaleLanguageDirectionRightToLeft;
}

// Check if the current application language is RTL
- (BOOL)isApplicationPreferredLanguageRTL
{
  NSString *preferredAppLanguage = [[[NSBundle mainBundle] preferredLocalizations] objectAtIndex:0];
  NSLocaleLanguageDirection direction = [NSLocale characterDirectionForLanguage:preferredAppLanguage];
  return direction == NSLocaleLanguageDirectionRightToLeft;
}

@end
