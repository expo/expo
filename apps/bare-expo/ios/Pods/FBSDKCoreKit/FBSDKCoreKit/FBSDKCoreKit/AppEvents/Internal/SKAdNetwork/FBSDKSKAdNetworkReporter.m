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

#import "TargetConditionals.h"

#if !TARGET_OS_TV

 #import "FBSDKSKAdNetworkReporter.h"

 #import <StoreKit/StoreKit.h>

 #import <objc/message.h>

 #import "FBSDKCoreKit+Internal.h"
 #import "FBSDKSKAdNetworkConversionConfiguration.h"

 #define FBSDK_SKADNETWORK_CONFIG_TIME_OUT 86400

typedef void (*send_type)(Class, SEL, NSInteger);

typedef void (^FBSDKSKAdNetworkReporterBlock)(void);

static NSString *const FBSDKSKAdNetworkConversionConfigurationKey = @"com.facebook.sdk:FBSDKSKAdNetworkConversionConfiguration";
static NSString *const FBSDKSKAdNetworkReporterKey = @"com.facebook.sdk:FBSDKSKAdNetworkReporter";

static BOOL g_isSKAdNetworkReportEnabled = NO;
static NSMutableArray<FBSDKSKAdNetworkReporterBlock> *g_completionBlocks;
static BOOL g_isRequestStarted = NO;
static dispatch_queue_t serialQueue;
static FBSDKSKAdNetworkConversionConfiguration *config;
static NSDate *g_configRefreshTimestamp;
static NSInteger g_conversionValue = 0;
static NSDate *g_timestamp = nil;
static NSMutableSet<NSString *> *g_recordedEvents;
static NSMutableDictionary<NSString *, NSMutableDictionary *> *g_recordedValues;

@implementation FBSDKSKAdNetworkReporter

+ (void)enable
{
  if (@available(iOS 14.0, *)) {
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
      [SKAdNetwork registerAppForAdNetworkAttribution];
      [self _loadReportData];
      g_completionBlocks = [NSMutableArray new];
      serialQueue = dispatch_queue_create("com.facebook.appevents.SKAdNetwork.FBSDKSKAdNetworkReporter", DISPATCH_QUEUE_SERIAL);
      [self _loadConfigurationWithBlock:^{
        [self _checkAndUpdateConversionValue];
        [self _checkAndRevokeTimer];
      }];
      g_isSKAdNetworkReportEnabled = YES;
    });
  }
}

+ (void)checkAndRevokeTimer
{
  if (@available(iOS 14.0, *)) {
    if (!g_isSKAdNetworkReportEnabled) {
      return;
    }
    [self _loadConfigurationWithBlock:^() {
      [self _checkAndRevokeTimer];
    }];
  }
}

+ (void)recordAndUpdateEvent:(NSString *)event
                    currency:(nullable NSString *)currency
                       value:(nullable NSNumber *)value
{
  if (@available(iOS 14.0, *)) {
    if (!g_isSKAdNetworkReportEnabled) {
      return;
    }
    if (!event.length) {
      return;
    }
    [self _loadConfigurationWithBlock:^() {
      [self _recordAndUpdateEvent:event currency:currency value:value];
    }];
  }
}

+ (void)_loadConfigurationWithBlock:(FBSDKSKAdNetworkReporterBlock)block
{
  if (!serialQueue) {
    return;
  }
  // Executes block if there is cache
  if ([self _isConfigRefreshTimestampValid] && [[NSUserDefaults standardUserDefaults] objectForKey:FBSDKSKAdNetworkConversionConfigurationKey]) {
    dispatch_async(serialQueue, ^() {
      [FBSDKTypeUtility array:g_completionBlocks addObject:block];
      for (FBSDKSKAdNetworkReporterBlock executionBlock in g_completionBlocks) {
        executionBlock();
      }
      [g_completionBlocks removeAllObjects];
    });
    return;
  }
  dispatch_async(serialQueue, ^{
    [FBSDKTypeUtility array:g_completionBlocks addObject:block];
    if (g_isRequestStarted) {
      return;
    }
    g_isRequestStarted = YES;
    FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc]
                                  initWithGraphPath:[NSString stringWithFormat:@"%@/ios_skadnetwork_conversion_config", [FBSDKSettings appID]]];
    [request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection, id result, NSError *error) {
      dispatch_async(serialQueue, ^{
        if (error) {
          g_isRequestStarted = NO;
          return;
        }
        NSDictionary<NSString *, id> *json = [FBSDKTypeUtility dictionaryValue:result];
        if (json) {
          [[NSUserDefaults standardUserDefaults] setObject:json forKey:FBSDKSKAdNetworkConversionConfigurationKey];
          g_configRefreshTimestamp = [NSDate date];
          config = [[FBSDKSKAdNetworkConversionConfiguration alloc] initWithJSON:json];
          for (FBSDKSKAdNetworkReporterBlock executionBlock in g_completionBlocks) {
            executionBlock();
          }
          [g_completionBlocks removeAllObjects];
          g_isRequestStarted = NO;
        }
      });
    }];
  });
}

+ (void)_checkAndRevokeTimer
{
  if (!config) {
    return;
  }
  if ([self _shouldCutoff]) {
    return;
  }
  if (g_conversionValue > config.timerBuckets) {
    return;
  }
  if (g_timestamp && [[NSDate date] timeIntervalSinceDate:g_timestamp] < config.timerInterval) {
    return;
  }
  [FBSDKSKAdNetworkReporter _updateConversionValue:g_conversionValue];
}

+ (void)_recordAndUpdateEvent:(NSString *)event
                     currency:(nullable NSString *)currency
                        value:(nullable NSNumber *)value
{
  if (!config) {
    return;
  }
  if ([self _shouldCutoff]) {
    return;
  }
  if (![config.eventSet containsObject:event] && ![FBSDKAppEventsUtility isStandardEvent:event]) {
    return;
  }
  BOOL isCacheUpdated = false;
  if (![g_recordedEvents containsObject:event]) {
    [g_recordedEvents addObject:event];
    isCacheUpdated = true;
  }
  // Change currency to default currency if currency is not found in currencySet
  NSString *valueCurrency = [currency uppercaseString];
  if (![config.currencySet containsObject:valueCurrency]) {
    valueCurrency = config.defaultCurrency;
  }
  if (value != nil) {
    NSMutableDictionary *mapping = [[FBSDKTypeUtility dictionary:g_recordedValues objectForKey:event ofType:NSDictionary.class] mutableCopy] ?: [NSMutableDictionary new];
    NSNumber *valueInMapping = [FBSDKTypeUtility dictionary:mapping objectForKey:valueCurrency ofType:NSNumber.class] ?: [NSNumber numberWithDouble:0];
    [FBSDKTypeUtility dictionary:mapping setObject:[NSNumber numberWithDouble:(valueInMapping.doubleValue + value.doubleValue)] forKey:valueCurrency];
    [FBSDKTypeUtility dictionary:g_recordedValues setObject:mapping forKey:event];
    isCacheUpdated = true;
  }
  if (isCacheUpdated) {
    [self _checkAndUpdateConversionValue];
    [self _saveReportData];
  }
}

+ (void)_checkAndUpdateConversionValue
{
  // Update conversion value if a rule is matched
  for (FBSDKSKAdNetworkRule *rule in config.conversionValueRules) {
    if (rule.conversionValue < g_conversionValue) {
      break;
    }
    if ([rule isMatchedWithRecordedEvents:g_recordedEvents recordedValues:g_recordedValues]) {
      [self _updateConversionValue:rule.conversionValue];
      break;
    }
  }
}

+ (void)_updateConversionValue:(NSInteger)value
{
  if (@available(iOS 14.0, *)) {
    if ([self _shouldCutoff]) {
      return;
    }
    SEL selector = NSSelectorFromString(@"updateConversionValue:");
    if (![[SKAdNetwork class] respondsToSelector:selector]) {
      return;
    }
    send_type msgSend = (send_type)objc_msgSend;
    msgSend([SKAdNetwork class], selector, value);
    g_conversionValue = value + 1;
    g_timestamp = [NSDate date];
    [self _saveReportData];
  }
}

+ (BOOL)_shouldCutoff
{
  if (!config.cutoffTime) {
    return true;
  }
  NSDate *installTimestamp = [[NSUserDefaults standardUserDefaults] objectForKey:@"com.facebook.sdk:FBSDKSettingsInstallTimestamp"];
  return [installTimestamp isKindOfClass:NSDate.class] && [[NSDate date] timeIntervalSinceDate:installTimestamp] > config.cutoffTime * 86400;
}

 #pragma clang diagnostic push
 #pragma clang diagnostic ignored "-Wdeprecated-declarations"
+ (void)_loadReportData
{
  id cachedJSON = [[NSUserDefaults standardUserDefaults] objectForKey:FBSDKSKAdNetworkConversionConfigurationKey];
  config = [[FBSDKSKAdNetworkConversionConfiguration alloc] initWithJSON:cachedJSON];
  NSData *cachedReportData = [[NSUserDefaults standardUserDefaults] objectForKey:FBSDKSKAdNetworkReporterKey];
  g_recordedEvents = [NSMutableSet new];
  g_recordedValues = [NSMutableDictionary new];
  if ([cachedReportData isKindOfClass:[NSData class]]) {
    NSDictionary<NSString *, id> *data = [FBSDKTypeUtility dictionaryValue:[NSKeyedUnarchiver unarchiveObjectWithData:cachedReportData]];
    if (data) {
      g_conversionValue = [FBSDKTypeUtility integerValue:data[@"conversion_value"]];
      g_timestamp = [FBSDKTypeUtility dictionary:data objectForKey:@"timestamp" ofType:NSDate.class];
      g_recordedEvents = [[FBSDKTypeUtility dictionary:data objectForKey:@"recorded_events" ofType:NSSet.class] mutableCopy] ?: [NSMutableSet new];
      g_recordedValues = [[FBSDKTypeUtility dictionary:data objectForKey:@"recorded_values" ofType:NSDictionary.class] mutableCopy] ?: [NSMutableDictionary new];
    }
  }
}

+ (void)_saveReportData
{
  NSMutableDictionary<NSString *, id> *reportData = [NSMutableDictionary new];
  [FBSDKTypeUtility dictionary:reportData setObject:@(g_conversionValue) forKey:@"conversion_value"];
  [FBSDKTypeUtility dictionary:reportData setObject:g_timestamp forKey:@"timestamp"];
  [FBSDKTypeUtility dictionary:reportData setObject:g_recordedEvents forKey:@"recorded_events"];
  [FBSDKTypeUtility dictionary:reportData setObject:g_recordedValues forKey:@"recorded_values"];
  NSData *cache = [NSKeyedArchiver archivedDataWithRootObject:reportData];
  if (cache) {
    [[NSUserDefaults standardUserDefaults] setObject:cache forKey:FBSDKSKAdNetworkReporterKey];
  }
}

 #pragma clang diagnostic pop

+ (BOOL)_isConfigRefreshTimestampValid
{
  return g_configRefreshTimestamp && [[NSDate date] timeIntervalSinceDate:g_configRefreshTimestamp] < FBSDK_SKADNETWORK_CONFIG_TIME_OUT;
}

 #pragma mark - Testability

 #if DEBUG

+ (void)setConfiguration:(FBSDKSKAdNetworkConversionConfiguration *)configuration
{
  config = configuration;
}

+ (void)setSKAdNetworkReportEnabled:(BOOL)enabled
{
  g_isSKAdNetworkReportEnabled = enabled;
}

 #endif

@end

#endif
