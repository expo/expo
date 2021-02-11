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

#import "FBSDKAppEventsConfiguration.h"

#import "FBSDKCoreKit+Internal.h"

#define FBSDK_APP_EVENTS_CONFIGURATION_DEFAULT_ATE_STATUS_KEY @"default_ate_status"
#define FBSDK_APP_EVENTS_CONFIGURATION_ADVERTISER_ID_TRACKING_ENABLED_KEY @"advertiser_id_collection_enabled"
#define FBSDK_APP_EVENTS_CONFIGURATION_EVENT_COLLECTION_ENABLED_KEY @"event_collection_enabled"

@implementation FBSDKAppEventsConfiguration

- (instancetype)initWithJSON:(nullable NSDictionary<NSString *, id> *)dict
{
  if ((self = [super init])) {
    @try {
      dict = [FBSDKTypeUtility dictionaryValue:dict];
      if (!dict) {
        return FBSDKAppEventsConfiguration.defaultConfiguration;
      }
      NSDictionary<NSString *, id> *configs = [FBSDKTypeUtility dictionary:dict objectForKey:@"app_events_config" ofType:NSDictionary.class];
      if (!configs) {
        return FBSDKAppEventsConfiguration.defaultConfiguration;
      }
      NSNumber *defaultATEStatus = [FBSDKTypeUtility numberValue:configs[FBSDK_APP_EVENTS_CONFIGURATION_DEFAULT_ATE_STATUS_KEY]] ?: @(FBSDKAdvertisingTrackingUnspecified);
      NSNumber *advertiserIDCollectionEnabled = [FBSDKTypeUtility numberValue:configs[FBSDK_APP_EVENTS_CONFIGURATION_ADVERTISER_ID_TRACKING_ENABLED_KEY]] ?: @(YES);
      NSNumber *eventCollectionEnabled = [FBSDKTypeUtility numberValue:configs[FBSDK_APP_EVENTS_CONFIGURATION_EVENT_COLLECTION_ENABLED_KEY]] ?: @(NO);
      _defaultATEStatus = [defaultATEStatus integerValue];
      _advertiserIDCollectionEnabled = [advertiserIDCollectionEnabled boolValue];
      _eventCollectionEnabled = [eventCollectionEnabled boolValue];
    } @catch (NSException *exception) {
      return FBSDKAppEventsConfiguration.defaultConfiguration;
    }
  }
  return self;
}

- (instancetype)initWithDefaultATEStatus:(FBSDKAdvertisingTrackingStatus)defaultATEStatus
           advertiserIDCollectionEnabled:(BOOL)advertiserIDCollectionEnabled
                  eventCollectionEnabled:(BOOL)eventCollectionEnabled
{
  if ((self = [super init])) {
    _defaultATEStatus = defaultATEStatus;
    _advertiserIDCollectionEnabled = advertiserIDCollectionEnabled;
    _eventCollectionEnabled = eventCollectionEnabled;
  }
  return self;
}

+ (instancetype)defaultConfiguration
{
  FBSDKAppEventsConfiguration *config = [[FBSDKAppEventsConfiguration alloc] initWithDefaultATEStatus:FBSDKAdvertisingTrackingUnspecified
                                                                        advertiserIDCollectionEnabled:YES
                                                                               eventCollectionEnabled:NO];
  return config;
}

#pragma mark - NSCoding

+ (BOOL)supportsSecureCoding
{
  return YES;
}

- (instancetype)initWithCoder:(NSCoder *)decoder
{
  FBSDKAdvertisingTrackingStatus defaultATEStatus = [decoder decodeIntegerForKey:FBSDK_APP_EVENTS_CONFIGURATION_DEFAULT_ATE_STATUS_KEY];
  BOOL advertisingIDCollectionEnabled = [decoder decodeBoolForKey:FBSDK_APP_EVENTS_CONFIGURATION_ADVERTISER_ID_TRACKING_ENABLED_KEY];
  BOOL eventCollectionEnabled = [decoder decodeBoolForKey:FBSDK_APP_EVENTS_CONFIGURATION_EVENT_COLLECTION_ENABLED_KEY];
  return [[FBSDKAppEventsConfiguration alloc] initWithDefaultATEStatus:defaultATEStatus
                                         advertiserIDCollectionEnabled:advertisingIDCollectionEnabled
                                                eventCollectionEnabled:eventCollectionEnabled];
}

- (void)encodeWithCoder:(NSCoder *)encoder
{
  [encoder encodeInteger:_defaultATEStatus forKey:FBSDK_APP_EVENTS_CONFIGURATION_DEFAULT_ATE_STATUS_KEY];
  [encoder encodeBool:_advertiserIDCollectionEnabled forKey:FBSDK_APP_EVENTS_CONFIGURATION_ADVERTISER_ID_TRACKING_ENABLED_KEY];
  [encoder encodeBool:_eventCollectionEnabled forKey:FBSDK_APP_EVENTS_CONFIGURATION_EVENT_COLLECTION_ENABLED_KEY];
}

#pragma mark - NSCopying

- (instancetype)copyWithZone:(NSZone *)zone
{
  return self;
}

#pragma mark - Testability

#if DEBUG

- (void)setDefaultATEStatus:(FBSDKAdvertisingTrackingStatus)status
{
  _defaultATEStatus = status;
}

#endif

@end
