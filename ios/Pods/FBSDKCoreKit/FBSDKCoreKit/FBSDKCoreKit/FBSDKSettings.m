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

#import "FBSDKSettings+Internal.h"

#import "FBSDKAccessTokenCache.h"
#import "FBSDKAccessTokenExpirer.h"
#import "FBSDKCoreKit.h"

#define FBSDKSETTINGS_PLIST_CONFIGURATION_SETTING_IMPL(TYPE, PLIST_KEY, GETTER, SETTER, DEFAULT_VALUE) \
static TYPE *g_##PLIST_KEY = nil; \
+ (TYPE *)GETTER \
{ \
  if (!g_##PLIST_KEY) { \
    g_##PLIST_KEY = [[[NSBundle mainBundle] objectForInfoDictionaryKey:@#PLIST_KEY] copy] ?: DEFAULT_VALUE; \
  } \
  return g_##PLIST_KEY; \
} \
+ (void)SETTER:(TYPE *)value { \
  g_##PLIST_KEY = [value copy]; \
}

NSString *const FBSDKLoggingBehaviorAccessTokens = @"include_access_tokens";
NSString *const FBSDKLoggingBehaviorPerformanceCharacteristics = @"perf_characteristics";
NSString *const FBSDKLoggingBehaviorAppEvents = @"app_events";
NSString *const FBSDKLoggingBehaviorInformational = @"informational";
NSString *const FBSDKLoggingBehaviorCacheErrors = @"cache_errors";
NSString *const FBSDKLoggingBehaviorUIControlErrors = @"ui_control_errors";
NSString *const FBSDKLoggingBehaviorDeveloperErrors = @"developer_errors";
NSString *const FBSDKLoggingBehaviorGraphAPIDebugWarning = @"graph_api_debug_warning";
NSString *const FBSDKLoggingBehaviorGraphAPIDebugInfo = @"graph_api_debug_info";
NSString *const FBSDKLoggingBehaviorNetworkRequests = @"network_requests";

static NSObject<FBSDKAccessTokenCaching> *g_tokenCache;
static NSMutableSet *g_loggingBehaviors;
static NSString *g_legacyUserDefaultTokenInformationKeyName = @"FBAccessTokenInformationKey";
static NSString *const FBSDKSettingsLimitEventAndDataUsage = @"com.facebook.sdk:FBSDKSettingsLimitEventAndDataUsage";
static BOOL g_disableErrorRecovery;
static NSString *g_userAgentSuffix;
static NSString *g_defaultGraphAPIVersion;
static FBSDKAccessTokenExpirer *g_accessTokenExpirer;

@implementation FBSDKSettings

+ (void)initialize
{
  if (self == [FBSDKSettings class]) {
    g_tokenCache = [[FBSDKAccessTokenCache alloc] init];
    g_accessTokenExpirer = [[FBSDKAccessTokenExpirer alloc] init];
  }
}

#pragma mark - Plist Configuration Settings

FBSDKSETTINGS_PLIST_CONFIGURATION_SETTING_IMPL(NSString, FacebookAppID, appID, setAppID, nil);
FBSDKSETTINGS_PLIST_CONFIGURATION_SETTING_IMPL(NSString, FacebookUrlSchemeSuffix, appURLSchemeSuffix, setAppURLSchemeSuffix, nil);
FBSDKSETTINGS_PLIST_CONFIGURATION_SETTING_IMPL(NSString, FacebookClientToken, clientToken, setClientToken, nil);
FBSDKSETTINGS_PLIST_CONFIGURATION_SETTING_IMPL(NSString, FacebookDisplayName, displayName, setDisplayName, nil);
FBSDKSETTINGS_PLIST_CONFIGURATION_SETTING_IMPL(NSString, FacebookDomainPart, facebookDomainPart, setFacebookDomainPart, nil);
FBSDKSETTINGS_PLIST_CONFIGURATION_SETTING_IMPL(NSNumber, FacebookJpegCompressionQuality, _JPEGCompressionQualityNumber, _setJPEGCompressionQualityNumber, @0.9);
FBSDKSETTINGS_PLIST_CONFIGURATION_SETTING_IMPL(NSNumber, FacebookAutoLogAppEventsEnabled, autoLogAppEventsEnabled,
  setAutoLogAppEventsEnabled, @1);
FBSDKSETTINGS_PLIST_CONFIGURATION_SETTING_IMPL(NSNumber, FacebookCodelessDebugLogEnabled, codelessDebugLogEnabled,
  setCodelessDebugLogEnabled, @0);
FBSDKSETTINGS_PLIST_CONFIGURATION_SETTING_IMPL(NSNumber, FacebookAdvertiserIDCollectionEnabled, advertiserIDCollectionEnabled,
  setAdvertiserIDCollectionEnabled, @1);

+ (void)setGraphErrorRecoveryDisabled:(BOOL)disableGraphErrorRecovery {
  g_disableErrorRecovery = disableGraphErrorRecovery;
}

+ (BOOL)isGraphErrorRecoveryDisabled {
  return g_disableErrorRecovery;
}

+ (CGFloat)JPEGCompressionQuality
{
  return [self _JPEGCompressionQualityNumber].floatValue;
}

+ (void)setJPEGCompressionQuality:(CGFloat)JPEGCompressionQuality
{
  [self _setJPEGCompressionQualityNumber:@(JPEGCompressionQuality)];
}

+ (BOOL)limitEventAndDataUsage
{
  NSNumber *storedValue = [[NSUserDefaults standardUserDefaults] objectForKey:FBSDKSettingsLimitEventAndDataUsage];
  if (storedValue == nil) {
    return NO;
  }
  return storedValue.boolValue;
}

+ (void)setLimitEventAndDataUsage:(BOOL)limitEventAndDataUsage
{
  NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
  [defaults setObject:@(limitEventAndDataUsage) forKey:FBSDKSettingsLimitEventAndDataUsage];
  [defaults synchronize];
}

+ (NSSet<NSString *> *)loggingBehaviors
{
  if (!g_loggingBehaviors) {
    NSArray *bundleLoggingBehaviors = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"FacebookLoggingBehavior"];
    if (bundleLoggingBehaviors) {
      g_loggingBehaviors = [[NSMutableSet alloc] initWithArray:bundleLoggingBehaviors];
    } else {
      // Establish set of default enabled logging behaviors.  You can completely disable logging by
      // specifying an empty array for FacebookLoggingBehavior in your Info.plist.
      g_loggingBehaviors = [[NSMutableSet alloc] initWithObjects:FBSDKLoggingBehaviorDeveloperErrors, nil];
    }
  }
  return [g_loggingBehaviors copy];
}

+ (void)setLoggingBehaviors:(NSSet<NSString *> *)loggingBehaviors
{
  if (![g_loggingBehaviors isEqualToSet:loggingBehaviors]) {
    g_loggingBehaviors = [loggingBehaviors mutableCopy];

    [self updateGraphAPIDebugBehavior];
  }
}

+ (NSSet *)loggingBehavior
{
  return [self loggingBehaviors];
}

+ (void)setLoggingBehavior:(NSSet *)loggingBehavior
{
  [self setLoggingBehaviors:loggingBehavior];
}

+ (void)enableLoggingBehavior:(NSString *)loggingBehavior
{
  if (!g_loggingBehaviors) {
    [self loggingBehaviors];
  }
  [g_loggingBehaviors addObject:loggingBehavior];
  [self updateGraphAPIDebugBehavior];
}

+ (void)disableLoggingBehavior:(NSString *)loggingBehavior
{
  if (!g_loggingBehaviors) {
    [self loggingBehaviors];
  }
  [g_loggingBehaviors removeObject:loggingBehavior];
  [self updateGraphAPIDebugBehavior];
}

+ (void)setLegacyUserDefaultTokenInformationKeyName:(NSString *)tokenInformationKeyName
{
  if (![g_legacyUserDefaultTokenInformationKeyName isEqualToString:tokenInformationKeyName]) {
    g_legacyUserDefaultTokenInformationKeyName = tokenInformationKeyName;
  }
}

+ (NSString *)legacyUserDefaultTokenInformationKeyName
{
  return g_legacyUserDefaultTokenInformationKeyName;
}

#pragma mark - Readonly Configuration Settings

+ (NSString *)sdkVersion
{
  return FBSDK_VERSION_STRING;
}

#pragma mark - Internal

+ (NSObject<FBSDKAccessTokenCaching> *)accessTokenCache
{
  return g_tokenCache;
}

+ (void)setAccessTokenCache:(NSObject<FBSDKAccessTokenCaching> *)cache
{
  if (g_tokenCache != cache) {
    g_tokenCache = cache;
  }
}

+ (NSString *)userAgentSuffix
{
  return g_userAgentSuffix;
}

+ (void)setUserAgentSuffix:(NSString *)suffix
{
  if (![g_userAgentSuffix isEqualToString:suffix]) {
    g_userAgentSuffix = suffix;
  }
}

+ (void)setGraphAPIVersion:(NSString *)version
{
  if (![g_defaultGraphAPIVersion isEqualToString:version])
  {
    g_defaultGraphAPIVersion = version;
  }
}

+ (NSString *)graphAPIVersion
{
  return g_defaultGraphAPIVersion ?: FBSDK_TARGET_PLATFORM_VERSION;
}

#pragma mark - Internal - Graph API Debug

+ (void)updateGraphAPIDebugBehavior
{
  // Enable Warnings everytime Info is enabled
  if ([g_loggingBehaviors containsObject:FBSDKLoggingBehaviorGraphAPIDebugInfo]
      && ![g_loggingBehaviors containsObject:FBSDKLoggingBehaviorGraphAPIDebugWarning]) {
    [g_loggingBehaviors addObject:FBSDKLoggingBehaviorGraphAPIDebugWarning];
  }
}

+ (NSString *)graphAPIDebugParamValue
{
  if ([[self loggingBehaviors] containsObject:FBSDKLoggingBehaviorGraphAPIDebugInfo]) {
    return @"info";
  } else if ([[self loggingBehaviors] containsObject:FBSDKLoggingBehaviorGraphAPIDebugWarning]) {
    return @"warning";
  }

  return nil;
}

@end
