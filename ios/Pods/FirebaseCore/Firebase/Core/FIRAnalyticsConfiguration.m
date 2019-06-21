// Copyright 2017 Google
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#import <Foundation/Foundation.h>

#import "Private/FIRAnalyticsConfiguration.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-implementations"
@implementation FIRAnalyticsConfiguration
#pragma clang diagnostic pop

+ (FIRAnalyticsConfiguration *)sharedInstance {
  static FIRAnalyticsConfiguration *sharedInstance = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [[FIRAnalyticsConfiguration alloc] init];
  });
  return sharedInstance;
}

- (void)postNotificationName:(NSString *)name value:(id)value {
  if (!name.length || !value) {
    return;
  }
  [[NSNotificationCenter defaultCenter] postNotificationName:name
                                                      object:self
                                                    userInfo:@{name : value}];
}

- (void)setAnalyticsCollectionEnabled:(BOOL)analyticsCollectionEnabled {
  [self setAnalyticsCollectionEnabled:analyticsCollectionEnabled persistSetting:YES];
}

- (void)setAnalyticsCollectionEnabled:(BOOL)analyticsCollectionEnabled
                       persistSetting:(BOOL)shouldPersist {
  // Persist the measurementEnabledState. Use FIRAnalyticsEnabledState values instead of YES/NO.
  FIRAnalyticsEnabledState analyticsEnabledState =
      analyticsCollectionEnabled ? kFIRAnalyticsEnabledStateSetYes : kFIRAnalyticsEnabledStateSetNo;
  if (shouldPersist) {
    NSUserDefaults *userDefaults = [NSUserDefaults standardUserDefaults];
    [userDefaults setObject:@(analyticsEnabledState)
                     forKey:kFIRAPersistedConfigMeasurementEnabledStateKey];
    [userDefaults synchronize];
  }

  [self postNotificationName:kFIRAnalyticsConfigurationSetEnabledNotification
                       value:@(analyticsCollectionEnabled)];
}

@end
