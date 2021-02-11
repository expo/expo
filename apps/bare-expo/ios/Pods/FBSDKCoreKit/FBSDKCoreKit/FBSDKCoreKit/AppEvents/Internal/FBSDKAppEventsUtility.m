// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
//
// You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
// copy, modify, and distribute this software in source code or binary form for use
// in connection with the web services and APIs provided by Facebook.
//
// As with any software that integrates with the Facebook platform, your use of
// this software is subject to the Facebook Developer Principles and Policies
// [http://developers.facebook.com/policy/]. This copyright notice shall be
// included in all copies or substantial portions of the software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

#import "FBSDKAppEventsUtility.h"

#import <AdSupport/AdSupport.h>

#import <objc/runtime.h>

#import "FBSDKAccessToken.h"
#import "FBSDKAppEvents.h"
#import "FBSDKAppEventsConfiguration.h"
#import "FBSDKAppEventsConfigurationManager.h"
#import "FBSDKAppEventsDeviceInfo.h"
#import "FBSDKConstants.h"
#import "FBSDKDynamicFrameworkLoader.h"
#import "FBSDKError.h"
#import "FBSDKInternalUtility.h"
#import "FBSDKLogger.h"
#import "FBSDKSettings.h"
#import "FBSDKSettings+Internal.h"
#import "FBSDKTimeSpentData.h"

#define FBSDK_APPEVENTSUTILITY_ANONYMOUSIDFILENAME @"com-facebook-sdk-PersistedAnonymousID.json"
#define FBSDK_APPEVENTSUTILITY_ANONYMOUSID_KEY @"anon_id"
#define FBSDK_APPEVENTSUTILITY_MAX_IDENTIFIER_LENGTH 40

static NSArray<NSString *> *standardEvents;

@implementation FBSDKAppEventsUtility

+ (void)initialize
{
  standardEvents = @[
    FBSDKAppEventNameCompletedRegistration,
    FBSDKAppEventNameViewedContent,
    FBSDKAppEventNameSearched,
    FBSDKAppEventNameRated,
    FBSDKAppEventNameCompletedTutorial,
    FBSDKAppEventNameAddedToCart,
    FBSDKAppEventNameAddedToWishlist,
    FBSDKAppEventNameInitiatedCheckout,
    FBSDKAppEventNameAddedPaymentInfo,
    FBSDKAppEventNamePurchased,
    FBSDKAppEventNameAchievedLevel,
    FBSDKAppEventNameUnlockedAchievement,
    FBSDKAppEventNameSpentCredits,
    FBSDKAppEventNameContact,
    FBSDKAppEventNameCustomizeProduct,
    FBSDKAppEventNameDonate,
    FBSDKAppEventNameFindLocation,
    FBSDKAppEventNameSchedule,
    FBSDKAppEventNameStartTrial,
    FBSDKAppEventNameSubmitApplication,
    FBSDKAppEventNameSubscribe,
    FBSDKAppEventNameAdImpression,
    FBSDKAppEventNameAdClick
  ];
}

+ (NSMutableDictionary *)activityParametersDictionaryForEvent:(NSString *)eventCategory
                                    shouldAccessAdvertisingID:(BOOL)shouldAccessAdvertisingID
{
  NSMutableDictionary *parameters = [NSMutableDictionary dictionary];
  [FBSDKTypeUtility dictionary:parameters setObject:eventCategory forKey:@"event"];

  if (shouldAccessAdvertisingID) {
    NSString *advertiserID = [[self class] advertiserID];
    [FBSDKTypeUtility dictionary:parameters setObject:advertiserID forKey:@"advertiser_id"];
  }

  [FBSDKTypeUtility dictionary:parameters setObject:[FBSDKBasicUtility anonymousID] forKey:FBSDK_APPEVENTSUTILITY_ANONYMOUSID_KEY];

  FBSDKAdvertisingTrackingStatus advertisingTrackingStatus = [FBSDKSettings getAdvertisingTrackingStatus];
  if (advertisingTrackingStatus != FBSDKAdvertisingTrackingUnspecified) {
    [FBSDKTypeUtility dictionary:parameters setObject:@([FBSDKSettings isAdvertiserTrackingEnabled]).stringValue forKey:@"advertiser_tracking_enabled"];
  }

  NSString *userData = [FBSDKAppEvents getUserData];
  if (userData) {
    [FBSDKTypeUtility dictionary:parameters setObject:userData forKey:@"ud"];
  }

  [FBSDKTypeUtility dictionary:parameters setObject:@(!FBSDKSettings.limitEventAndDataUsage).stringValue forKey:@"application_tracking_enabled"];
  [FBSDKTypeUtility dictionary:parameters setObject:@(FBSDKSettings.advertiserIDCollectionEnabled).stringValue forKey:@"advertiser_id_collection_enabled"];

  NSString *userID = [FBSDKAppEvents userID];
  if (userID) {
    [FBSDKTypeUtility dictionary:parameters setObject:userID forKey:@"app_user_id"];
  }

  NSDictionary<NSString *, id> *dataProcessingOptions = [FBSDKSettings dataProcessingOptions];
  if (dataProcessingOptions) {
    NSArray<NSString *> *options = (NSArray<NSString *> *)dataProcessingOptions[DATA_PROCESSING_OPTIONS];
    if (options && [options isKindOfClass:NSArray.class]) {
      NSString *optionsString = [FBSDKBasicUtility JSONStringForObject:options error:nil invalidObjectHandler:nil];
      [FBSDKTypeUtility dictionary:parameters
                         setObject:optionsString
                            forKey:DATA_PROCESSING_OPTIONS];
    }
    [FBSDKTypeUtility dictionary:parameters
                       setObject:dataProcessingOptions[DATA_PROCESSING_OPTIONS_COUNTRY]
                          forKey:DATA_PROCESSING_OPTIONS_COUNTRY];
    [FBSDKTypeUtility dictionary:parameters
                       setObject:dataProcessingOptions[DATA_PROCESSING_OPTIONS_STATE]
                          forKey:DATA_PROCESSING_OPTIONS_STATE];
  }

  [FBSDKAppEventsDeviceInfo extendDictionaryWithDeviceInfo:parameters];

  static dispatch_once_t fetchBundleOnce;
  static NSMutableArray *urlSchemes;

  dispatch_once(&fetchBundleOnce, ^{
    NSBundle *mainBundle = [NSBundle mainBundle];
    urlSchemes = [[NSMutableArray alloc] init];
    for (NSDictionary<NSString *, id> *fields in [mainBundle objectForInfoDictionaryKey:@"CFBundleURLTypes"]) {
      NSArray<NSString *> *schemesForType = fields[@"CFBundleURLSchemes"];
      if (schemesForType) {
        [urlSchemes addObjectsFromArray:schemesForType];
      }
    }
  });

  if (urlSchemes.count > 0) {
    [FBSDKTypeUtility dictionary:parameters setObject:[FBSDKBasicUtility JSONStringForObject:urlSchemes error:NULL invalidObjectHandler:NULL] forKey:@"url_schemes"];
  }

  return parameters;
}

+ (NSString *)advertiserID
{
  if (!FBSDKSettings.isAdvertiserIDCollectionEnabled) {
    return nil;
  }

  if (@available(iOS 14.0, *)) {
    if (![FBSDKAppEventsConfigurationManager cachedAppEventsConfiguration].advertiserIDCollectionEnabled) {
      return nil;
    }
  }

  NSString *result = nil;

  Class ASIdentifierManagerClass = fbsdkdfl_ASIdentifierManagerClass();
  if ([ASIdentifierManagerClass class]) {
    ASIdentifierManager *manager = [ASIdentifierManagerClass sharedManager];
    result = manager.advertisingIdentifier.UUIDString;
  }

  return result;
}

+ (BOOL)isStandardEvent:(nullable NSString *)event
{
  if (!event) {
    return NO;
  }
  return [standardEvents containsObject:event];
}

#pragma mark - Internal, for testing

+ (void)clearLibraryFiles
{
  [[NSFileManager defaultManager] removeItemAtPath:[[self class] persistenceFilePath:FBSDK_APPEVENTSUTILITY_ANONYMOUSIDFILENAME]
                                             error:NULL];
  [[NSFileManager defaultManager] removeItemAtPath:[[self class] persistenceFilePath:FBSDKTimeSpentFilename]
                                             error:NULL];
}

+ (void)ensureOnMainThread:(NSString *)methodName className:(NSString *)className
{
  FBSDKConditionalLog(
    [NSThread isMainThread],
    FBSDKLoggingBehaviorDeveloperErrors,
    @"*** <%@, %@> is not called on the main thread. This can lead to errors.",
    methodName,
    className
  );
}

+ (NSString *)flushReasonToString:(FBSDKAppEventsFlushReason)flushReason
{
  NSString *result = @"Unknown";
  switch (flushReason) {
    case FBSDKAppEventsFlushReasonExplicit:
      result = @"Explicit";
      break;
    case FBSDKAppEventsFlushReasonTimer:
      result = @"Timer";
      break;
    case FBSDKAppEventsFlushReasonSessionChange:
      result = @"SessionChange";
      break;
    case FBSDKAppEventsFlushReasonPersistedEvents:
      result = @"PersistedEvents";
      break;
    case FBSDKAppEventsFlushReasonEventThreshold:
      result = @"EventCountThreshold";
      break;
    case FBSDKAppEventsFlushReasonEagerlyFlushingEvent:
      result = @"EagerlyFlushingEvent";
      break;
  }
  return result;
}

+ (void)logAndNotify:(NSString *)msg
{
  [[self class] logAndNotify:msg allowLogAsDeveloperError:YES];
}

+ (void)logAndNotify:(NSString *)msg allowLogAsDeveloperError:(BOOL)allowLogAsDeveloperError
{
  NSString *behaviorToLog = FBSDKLoggingBehaviorAppEvents;
  if (allowLogAsDeveloperError) {
    if ([FBSDKSettings.loggingBehaviors containsObject:FBSDKLoggingBehaviorDeveloperErrors]) {
      // Rather than log twice, prefer 'DeveloperErrors' if it's set over AppEvents.
      behaviorToLog = FBSDKLoggingBehaviorDeveloperErrors;
    }
  }

  [FBSDKLogger singleShotLogEntry:behaviorToLog logEntry:msg];
  NSError *error = [FBSDKError errorWithCode:FBSDKErrorAppEventsFlush message:msg];
  [[NSNotificationCenter defaultCenter] postNotificationName:FBSDKAppEventsLoggingResultNotification object:error];
}

+ (BOOL)       matchString:(NSString *)string
         firstCharacterSet:(NSCharacterSet *)firstCharacterSet
  restOfStringCharacterSet:(NSCharacterSet *)restOfStringCharacterSet
{
  if (string.length == 0) {
    return NO;
  }
  for (NSUInteger i = 0; i < string.length; i++) {
    const unichar c = [string characterAtIndex:i];
    if (i == 0) {
      if (![firstCharacterSet characterIsMember:c]) {
        return NO;
      }
    } else {
      if (![restOfStringCharacterSet characterIsMember:c]) {
        return NO;
      }
    }
  }
  return YES;
}

+ (BOOL)regexValidateIdentifier:(NSString *)identifier
{
  static NSCharacterSet *firstCharacterSet;
  static NSCharacterSet *restOfStringCharacterSet;
  static dispatch_once_t onceToken;
  static NSMutableSet *cachedIdentifiers;
  dispatch_once(&onceToken, ^{
    NSMutableCharacterSet *mutableSet = [NSMutableCharacterSet alphanumericCharacterSet];
    [mutableSet addCharactersInString:@"_"];
    firstCharacterSet = [mutableSet copy];

    [mutableSet addCharactersInString:@"- "];
    restOfStringCharacterSet = [mutableSet copy];
    cachedIdentifiers = [[NSMutableSet alloc] init];
  });

  @synchronized(self) {
    if (![cachedIdentifiers containsObject:identifier]) {
      if ([self matchString:identifier
                  firstCharacterSet:firstCharacterSet
           restOfStringCharacterSet:restOfStringCharacterSet]) {
        [cachedIdentifiers addObject:identifier];
      } else {
        return NO;
      }
    }
  }
  return YES;
}

+ (BOOL)validateIdentifier:(NSString *)identifier
{
  if (identifier == nil || identifier.length == 0 || identifier.length > FBSDK_APPEVENTSUTILITY_MAX_IDENTIFIER_LENGTH || ![[self class] regexValidateIdentifier:identifier]) {
    [[self class] logAndNotify:[NSString stringWithFormat:@"Invalid identifier: '%@'.  Must be between 1 and %d characters, and must be contain only alphanumerics, _, - or spaces, starting with alphanumeric or _.",
                                identifier, FBSDK_APPEVENTSUTILITY_MAX_IDENTIFIER_LENGTH]];
    return NO;
  }

  return YES;
}

// Given a candidate token (which may be nil), find the real token to string to use.
// Precedence: 1) provided token, 2) current token, 3) app | client token, 4) fully anonymous session.
+ (NSString *)tokenStringToUseFor:(FBSDKAccessToken *)token
{
  if (!token) {
    token = [FBSDKAccessToken currentAccessToken];
  }

  NSString *appID = [FBSDKAppEvents loggingOverrideAppID] ?: token.appID ?: [FBSDKSettings appID];
  NSString *tokenString = token.tokenString;
  if (!tokenString || ![appID isEqualToString:token.appID]) {
    // If there's an logging override app id present, then we don't want to use the client token since the client token
    // is intended to match up with the primary app id (and AppEvents doesn't require a client token).
    NSString *clientTokenString = [FBSDKSettings clientToken];
    if (clientTokenString && appID && [appID isEqualToString:token.appID]) {
      tokenString = [NSString stringWithFormat:@"%@|%@", appID, clientTokenString];
    } else if (appID) {
      tokenString = nil;
    }
  }
  return tokenString;
}

+ (long)unixTimeNow
{
  return (long)round([NSDate date].timeIntervalSince1970);
}

+ (time_t)convertToUnixTime:(NSDate *)date
{
  return (time_t)round([date timeIntervalSince1970]);
}

+ (NSNumber *)getNumberValue:(NSString *)text
{
  NSNumber *value = @0;

  NSLocale *locale = [NSLocale currentLocale];

  NSString *ds = [locale objectForKey:NSLocaleDecimalSeparator] ?: @".";
  NSString *gs = [locale objectForKey:NSLocaleGroupingSeparator] ?: @",";
  NSString *separators = [ds stringByAppendingString:gs];

  NSString *regex = [NSString stringWithFormat:@"[+-]?([0-9]+[%1$@]?)?[%1$@]?([0-9]+[%1$@]?)+", separators];
  NSRegularExpression *re = [NSRegularExpression regularExpressionWithPattern:regex
                                                                      options:0
                                                                        error:nil];
  NSTextCheckingResult *match = [re firstMatchInString:text
                                               options:0
                                                 range:NSMakeRange(0, text.length)];
  if (match) {
    NSString *validText = [text substringWithRange:match.range];
    NSNumberFormatter *formatter = [[NSNumberFormatter alloc] init];
    formatter.locale = locale;
    formatter.numberStyle = NSNumberFormatterDecimalStyle;

    value = [formatter numberFromString:validText];
    if (nil == value) {
      value = @(validText.floatValue);
    }
  }

  return value;
}

+ (BOOL)isDebugBuild
{
#if TARGET_IPHONE_SIMULATOR
  return YES;
#else
  BOOL isDevelopment = NO;

  // There is no provisioning profile in AppStore Apps.
  @try {
    NSData *data = [NSData dataWithContentsOfFile:[NSBundle.mainBundle pathForResource:@"embedded" ofType:@"mobileprovision"]];
    if (data) {
      const char *bytes = [data bytes];
      NSMutableString *profile = [[NSMutableString alloc] initWithCapacity:data.length];
      for (NSUInteger i = 0; i < data.length; i++) {
        [profile appendFormat:@"%c", bytes[i]];
      }
      // Look for debug value, if detected we're in a development build.
      NSString *cleared = [[profile componentsSeparatedByCharactersInSet:NSCharacterSet.whitespaceAndNewlineCharacterSet] componentsJoinedByString:@""];
      isDevelopment = ([cleared rangeOfString:@"<key>get-task-allow</key><true/>"].length > 0);
    }

    return isDevelopment;
  } @catch (NSException *exception) {}

  return NO;
#endif
}

+ (BOOL)shouldDropAppEvent
{
  if (@available(iOS 14.0, *)) {
    if ([FBSDKSettings getAdvertisingTrackingStatus] == FBSDKAdvertisingTrackingDisallowed && ![FBSDKAppEventsConfigurationManager cachedAppEventsConfiguration].eventCollectionEnabled) {
      return YES;
    }
  }
  return NO;
}

+ (BOOL)isSensitiveUserData:(NSString *)text
{
  if (0 == text.length) {
    return NO;
  }

  return [self isEmailAddress:text] || [self isCreditCardNumber:text];
}

+ (BOOL)isCreditCardNumber:(NSString *)text
{
  text = [[text componentsSeparatedByCharactersInSet:[NSCharacterSet.decimalDigitCharacterSet invertedSet]] componentsJoinedByString:@""];

  if (text.doubleValue == 0) {
    return NO;
  }

  if (text.length < 9 || text.length > 21) {
    return NO;
  }

  const char *chars = [text cStringUsingEncoding:NSUTF8StringEncoding];
  if (NULL == chars) {
    return NO;
  }

  BOOL isOdd = YES;
  int oddSum = 0;
  int evenSum = 0;

  for (int i = (int)text.length - 1; i >= 0; i--) {
    int digit = chars[i] - '0';

    if (isOdd) {
      oddSum += digit;
    } else {
      evenSum += digit / 5 + (2 * digit) % 10;
    }

    isOdd = !isOdd;
  }

  return ((oddSum + evenSum) % 10 == 0);
}

+ (BOOL)isEmailAddress:(NSString *)text
{
  NSString *pattern = @"[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,4}";
  NSRegularExpression *regex = [[NSRegularExpression alloc] initWithPattern:pattern options:NSRegularExpressionCaseInsensitive error:nil];
  NSUInteger matches = [regex numberOfMatchesInString:text options:0 range:NSMakeRange(0, [text length])];
  return matches > 0;
}

@end
