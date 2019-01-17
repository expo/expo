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

#import <objc/runtime.h>

#import <AdSupport/AdSupport.h>

#import "FBSDKAccessToken.h"
#import "FBSDKAppEvents.h"
#import "FBSDKAppEventsDeviceInfo.h"
#import "FBSDKConstants.h"
#import "FBSDKDynamicFrameworkLoader.h"
#import "FBSDKError.h"
#import "FBSDKInternalUtility.h"
#import "FBSDKLogger.h"
#import "FBSDKSettings.h"
#import "FBSDKTimeSpentData.h"

#define FBSDK_APPEVENTSUTILITY_ANONYMOUSIDFILENAME @"com-facebook-sdk-PersistedAnonymousID.json"
#define FBSDK_APPEVENTSUTILITY_ANONYMOUSID_KEY @"anon_id"
#define FBSDK_APPEVENTSUTILITY_MAX_IDENTIFIER_LENGTH 40

@implementation FBSDKAppEventsUtility

+ (NSMutableDictionary *)activityParametersDictionaryForEvent:(NSString *)eventCategory
                                           implicitEventsOnly:(BOOL)implicitEventsOnly
                                    shouldAccessAdvertisingID:(BOOL)shouldAccessAdvertisingID {
  NSMutableDictionary *parameters = [NSMutableDictionary dictionary];
  parameters[@"event"] = eventCategory;

#if __IPHONE_OS_VERSION_MIN_REQUIRED < __IPHONE_7_0
  NSString *attributionID = [[self class] attributionID];  // Only present on iOS 6 and below.
  [FBSDKInternalUtility dictionary:parameters setObject:attributionID forKey:@"attribution"];
#endif

  if (!implicitEventsOnly && shouldAccessAdvertisingID) {
    NSString *advertiserID = [[self class] advertiserID];
    [FBSDKInternalUtility dictionary:parameters setObject:advertiserID forKey:@"advertiser_id"];
  }

  parameters[FBSDK_APPEVENTSUTILITY_ANONYMOUSID_KEY] = [self anonymousID];

  FBSDKAdvertisingTrackingStatus advertisingTrackingStatus = [[self class] advertisingTrackingStatus];
  if (advertisingTrackingStatus != FBSDKAdvertisingTrackingUnspecified) {
    BOOL allowed = (advertisingTrackingStatus == FBSDKAdvertisingTrackingAllowed);
    parameters[@"advertiser_tracking_enabled"] = @(allowed).stringValue;
  }

  parameters[@"application_tracking_enabled"] = @(!FBSDKSettings.limitEventAndDataUsage).stringValue;

  NSString *userID = [FBSDKAppEvents userID];
  if (userID) {
    parameters[@"app_user_id"] = userID;
  }
  NSString *userData = [FBSDKAppEvents getUserData];
  if (userData){
    parameters[@"ud"] = userData;
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
    parameters[@"url_schemes"] = [FBSDKInternalUtility JSONStringForObject:urlSchemes error:NULL invalidObjectHandler:NULL];
  }

  return parameters;
}

+ (NSString *)advertiserID
{
  if (![[FBSDKSettings advertiserIDCollectionEnabled] boolValue]) {
    return nil;
  }

  NSString *result = nil;

  Class ASIdentifierManagerClass = fbsdkdfl_ASIdentifierManagerClass();
  if ([ASIdentifierManagerClass class]) {
    ASIdentifierManager *manager = [ASIdentifierManagerClass sharedManager];
    result = manager.advertisingIdentifier.UUIDString;
  }

  return result;
}

+ (FBSDKAdvertisingTrackingStatus)advertisingTrackingStatus
{
  static dispatch_once_t fetchAdvertisingTrackingStatusOnce;
  static FBSDKAdvertisingTrackingStatus status;

  dispatch_once(&fetchAdvertisingTrackingStatusOnce, ^{
    status = FBSDKAdvertisingTrackingUnspecified;
    Class ASIdentifierManagerClass = fbsdkdfl_ASIdentifierManagerClass();
    if ([ASIdentifierManagerClass class]) {
      ASIdentifierManager *manager = [ASIdentifierManagerClass sharedManager];
      if (manager) {
        status = manager.advertisingTrackingEnabled ? FBSDKAdvertisingTrackingAllowed : FBSDKAdvertisingTrackingDisallowed;
      }
    }
  });

  return status;
}

+ (NSString *)anonymousID
{
  // Grab previously written anonymous ID and, if none have been generated, create and
  // persist a new one which will remain associated with this app.
  NSString *result = [[self class] retrievePersistedAnonymousID];
  if (!result) {
    // Generate a new anonymous ID.  Create as a UUID, but then prepend the fairly
    // arbitrary 'XZ' to the front so it's easily distinguishable from IDFA's which
    // will only contain hex.
    result = [NSString stringWithFormat:@"XZ%@", [NSUUID UUID].UUIDString];

    [self persistAnonymousID:result];
  }
  return result;
}

+ (NSString *)attributionID
{
#if TARGET_OS_TV
  return nil;
#else
  return [UIPasteboard pasteboardWithName:@"fb_app_attribution" create:NO].string;
#endif
}

// for tests only.
+ (void)clearLibraryFiles
{
  [[NSFileManager defaultManager] removeItemAtPath:[[self class] persistenceFilePath:FBSDK_APPEVENTSUTILITY_ANONYMOUSIDFILENAME]
                                             error:NULL];
  [[NSFileManager defaultManager] removeItemAtPath:[[self class] persistenceFilePath:FBSDKTimeSpentFilename]
                                             error:NULL];
}

+ (void)ensureOnMainThread:(NSString *)methodName className:(NSString *)className
{
  FBSDKConditionalLog([NSThread isMainThread],
                      FBSDKLoggingBehaviorDeveloperErrors,
                      @"*** <%@, %@> is not called on the main thread. This can lead to errors.",
                      methodName,
                      className);
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
  NSError *error = [NSError fbErrorWithCode:FBSDKErrorAppEventsFlush message:msg];
  [[NSNotificationCenter defaultCenter] postNotificationName:FBSDKAppEventsLoggingResultNotification object:error];
}

+ (BOOL)matchString:(NSString *)string
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

+ (void)persistAnonymousID:(NSString *)anonymousID
{
  [[self class] ensureOnMainThread:NSStringFromSelector(_cmd) className:NSStringFromClass(self)];
  NSDictionary *data = @{ FBSDK_APPEVENTSUTILITY_ANONYMOUSID_KEY : anonymousID };
  NSString *content = [FBSDKInternalUtility JSONStringForObject:data error:NULL invalidObjectHandler:NULL];

  [content writeToFile:[[self class] persistenceFilePath:FBSDK_APPEVENTSUTILITY_ANONYMOUSIDFILENAME]
            atomically:YES
              encoding:NSASCIIStringEncoding
                 error:nil];
}

+ (NSString *)persistenceFilePath:(NSString *)filename
{
  NSSearchPathDirectory directory = NSLibraryDirectory;
  NSArray *paths = NSSearchPathForDirectoriesInDomains(directory, NSUserDomainMask, YES);
  NSString *docDirectory = paths[0];
  return [docDirectory stringByAppendingPathComponent:filename];
}

+ (NSString *)retrievePersistedAnonymousID
{
  [[self class] ensureOnMainThread:NSStringFromSelector(_cmd) className:NSStringFromClass(self)];
  NSString *file = [[self class] persistenceFilePath:FBSDK_APPEVENTSUTILITY_ANONYMOUSIDFILENAME];
  NSString *content = [[NSString alloc] initWithContentsOfFile:file
                                                      encoding:NSASCIIStringEncoding
                                                         error:nil];
  NSDictionary *results = [FBSDKInternalUtility objectForJSONString:content error:NULL];
  return results[FBSDK_APPEVENTSUTILITY_ANONYMOUSID_KEY];
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
    if (clientTokenString && appID && [appID isEqualToString:token.appID]){
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

+ (id)getVariable:(NSString *)variableName fromInstance:(NSObject *)instance {
  Ivar ivar = class_getInstanceVariable([instance class], variableName.UTF8String);
  if (ivar != NULL) {
    const char *encoding = ivar_getTypeEncoding(ivar);
    if (encoding != NULL && encoding[0] == '@') {
      return object_getIvar(instance, ivar);
    }
  }

  return nil;
}

+ (NSNumber *)getNumberValue:(NSString *)text {
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

+ (BOOL)isDebugBuild {
#if TARGET_IPHONE_SIMULATOR
  return YES;
#else
  BOOL isDevelopment = NO;

  // There is no provisioning profile in AppStore Apps.
  @try
  {
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
  }
  @catch(NSException *exception)
  {

  }

  return NO;
#endif
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

    if (isOdd)
      oddSum += digit;
    else
      evenSum += digit / 5 + (2 * digit) % 10;

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
