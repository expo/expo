/*
 * Copyright 2017 Google
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import <Foundation/Foundation.h>

/// Values stored in analyticsEnabledState. Never alter these constants since they must match with
/// values persisted to disk.
typedef NS_ENUM(int64_t, FIRAnalyticsEnabledState) {
  // 0 is the default value for keys not found stored in persisted config, so it cannot represent
  // kFIRAnalyticsEnabledStateSetNo. It must represent kFIRAnalyticsEnabledStateNotSet.
  kFIRAnalyticsEnabledStateNotSet = 0,
  kFIRAnalyticsEnabledStateSetYes = 1,
  kFIRAnalyticsEnabledStateSetNo = 2,
};

/// The user defaults key for the persisted measurementEnabledState value. FIRAPersistedConfig reads
/// measurementEnabledState using this same key.
static NSString *const kFIRAPersistedConfigMeasurementEnabledStateKey =
    @"/google/measurement/measurement_enabled_state";

static NSString *const kFIRAnalyticsConfigurationSetEnabledNotification =
    @"FIRAnalyticsConfigurationSetEnabledNotification";
static NSString *const kFIRAnalyticsConfigurationSetMinimumSessionIntervalNotification =
    @"FIRAnalyticsConfigurationSetMinimumSessionIntervalNotification";
static NSString *const kFIRAnalyticsConfigurationSetSessionTimeoutIntervalNotification =
    @"FIRAnalyticsConfigurationSetSessionTimeoutIntervalNotification";

@interface FIRAnalyticsConfiguration : NSObject

/// Returns the shared instance of FIRAnalyticsConfiguration.
+ (FIRAnalyticsConfiguration *)sharedInstance;

// Sets whether analytics collection is enabled for this app on this device. This setting is
// persisted across app sessions. By default it is enabled.
- (void)setAnalyticsCollectionEnabled:(BOOL)analyticsCollectionEnabled;

/// Sets whether analytics collection is enabled for this app on this device, and a flag to persist
/// the value or not. The setting should not be persisted if being set by the global data collection
/// flag.
- (void)setAnalyticsCollectionEnabled:(BOOL)analyticsCollectionEnabled
                       persistSetting:(BOOL)shouldPersist;

@end
