/*
 * Copyright 2019 Google
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

#import "FIRInstanceIDCheckinPreferences+Internal.h"

#import "FIRInstanceIDCheckinService.h"
#import "FIRInstanceIDUtilities.h"

static NSString *const kCheckinKeychainContentSeparatorString = @"|";

@interface FIRInstanceIDCheckinPreferences ()

@property(nonatomic, readwrite, copy) NSString *deviceID;
@property(nonatomic, readwrite, copy) NSString *secretToken;
@property(nonatomic, readwrite, copy) NSString *digest;
@property(nonatomic, readwrite, copy) NSString *versionInfo;
@property(nonatomic, readwrite, copy) NSString *deviceDataVersion;

@property(nonatomic, readwrite, strong) NSMutableDictionary *gServicesData;
@property(nonatomic, readwrite, assign) int64_t lastCheckinTimestampMillis;

@end

@implementation FIRInstanceIDCheckinPreferences (Internal)

+ (FIRInstanceIDCheckinPreferences *)preferencesFromKeychainContents:(NSString *)keychainContent {
  NSString *deviceID = [self checkinDeviceIDFromKeychainContent:keychainContent];
  NSString *secret = [self checkinSecretFromKeychainContent:keychainContent];
  if ([deviceID length] && [secret length]) {
    return [[FIRInstanceIDCheckinPreferences alloc] initWithDeviceID:deviceID secretToken:secret];
  } else {
    return nil;
  }
}

- (instancetype)initWithDeviceID:(NSString *)deviceID secretToken:(NSString *)secretToken {
  self = [super init];
  if (self) {
    self.deviceID = [deviceID copy];
    self.secretToken = [secretToken copy];
  }
  return self;
}

- (void)reset {
  self.deviceID = nil;
  self.secretToken = nil;
  self.digest = nil;
  self.versionInfo = nil;
  self.gServicesData = nil;
  self.deviceDataVersion = nil;
  self.lastCheckinTimestampMillis = 0;
}

- (void)updateWithCheckinPlistContents:(NSDictionary *)checkinPlistContent {
  for (NSString *key in checkinPlistContent) {
    if ([kFIRInstanceIDDigestStringKey isEqualToString:key]) {
      self.digest = [checkinPlistContent[key] copy];
    } else if ([kFIRInstanceIDVersionInfoStringKey isEqualToString:key]) {
      self.versionInfo = [checkinPlistContent[key] copy];
    } else if ([kFIRInstanceIDLastCheckinTimeKey isEqualToString:key]) {
      self.lastCheckinTimestampMillis = [checkinPlistContent[key] longLongValue];
    } else if ([kFIRInstanceIDGServicesDictionaryKey isEqualToString:key]) {
      self.gServicesData = [checkinPlistContent[key] mutableCopy];
    } else if ([kFIRInstanceIDDeviceDataVersionKey isEqualToString:key]) {
      self.deviceDataVersion = [checkinPlistContent[key] copy];
    }
    // Otherwise we have some keys we don't care about
  }
}

- (NSString *)checkinKeychainContent {
  if ([self.deviceID length] && [self.secretToken length]) {
    return [NSString stringWithFormat:@"%@%@%@", self.deviceID,
                                      kCheckinKeychainContentSeparatorString, self.secretToken];
  } else {
    return nil;
  }
}

+ (NSString *)checkinDeviceIDFromKeychainContent:(NSString *)keychainContent {
  return [self checkinKeychainContent:keychainContent forIndex:0];
}

+ (NSString *)checkinSecretFromKeychainContent:(NSString *)keychainContent {
  return [self checkinKeychainContent:keychainContent forIndex:1];
}

+ (NSString *)checkinKeychainContent:(NSString *)keychainContent forIndex:(int)index {
  NSArray *keychainComponents =
      [keychainContent componentsSeparatedByString:kCheckinKeychainContentSeparatorString];
  if (index >= 0 && index < 2 && [keychainComponents count] == 2) {
    return keychainComponents[index];
  } else {
    return nil;
  }
}

@end
