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

#import "FIRInstanceIDCheckinService.h"

#import <FirebaseCore/FIRAppInternal.h>
#import "FIRInstanceIDCheckinPreferences+Internal.h"
#import "FIRInstanceIDCheckinPreferences_Private.h"
#import "FIRInstanceIDDefines.h"
#import "FIRInstanceIDLogger.h"
#import "FIRInstanceIDStore.h"
#import "FIRInstanceIDUtilities.h"
#import "NSError+FIRInstanceID.h"

static NSString *const kDeviceCheckinURL = @"https://device-provisioning.googleapis.com/checkin";

// keys in Checkin preferences
NSString *const kFIRInstanceIDDeviceAuthIdKey = @"GMSInstanceIDDeviceAuthIdKey";
NSString *const kFIRInstanceIDSecretTokenKey = @"GMSInstanceIDSecretTokenKey";
NSString *const kFIRInstanceIDDigestStringKey = @"GMSInstanceIDDigestKey";
NSString *const kFIRInstanceIDLastCheckinTimeKey = @"GMSInstanceIDLastCheckinTimestampKey";
NSString *const kFIRInstanceIDVersionInfoStringKey = @"GMSInstanceIDVersionInfo";
NSString *const kFIRInstanceIDGServicesDictionaryKey = @"GMSInstanceIDGServicesData";
NSString *const kFIRInstanceIDDeviceDataVersionKey = @"GMSInstanceIDDeviceDataVersion";
NSString *const kFIRInstanceIDFirebaseUserAgentKey = @"X-firebase-client";

static NSUInteger const kCheckinType = 2;  // DeviceType IOS in l/w/a/_checkin.proto
static NSUInteger const kCheckinVersion = 2;
static NSUInteger const kFragment = 0;

static FIRInstanceIDURLRequestTestBlock testBlock;

@interface FIRInstanceIDCheckinService ()

@property(nonatomic, readwrite, strong) NSURLSession *session;

@end

@implementation FIRInstanceIDCheckinService
;

- (instancetype)init {
  self = [super init];
  if (self) {
    // Create an URLSession once, even though checkin should happen about once a day
    NSURLSessionConfiguration *config = [NSURLSessionConfiguration defaultSessionConfiguration];
    config.timeoutIntervalForResource = 60.0f;  // 1 minute
    config.allowsCellularAccess = YES;
    _session = [NSURLSession sessionWithConfiguration:config];
    _session.sessionDescription = @"com.google.iid-checkin";
  }
  return self;
}

- (void)dealloc {
  testBlock = nil;
  [self.session invalidateAndCancel];
}

- (void)checkinWithExistingCheckin:(FIRInstanceIDCheckinPreferences *)existingCheckin
                        completion:(FIRInstanceIDDeviceCheckinCompletion)completion {
  _FIRInstanceIDDevAssert(completion != nil, @"completion required");

  if (self.session == nil) {
    FIRInstanceIDLoggerError(kFIRIntsanceIDInvalidNetworkSession,
                             @"Inconsistent state: NSURLSession has been invalidated");
    NSError *error =
        [NSError errorWithFIRInstanceIDErrorCode:kFIRInstanceIDErrorCodeRegistrarFailedToCheckIn];
    completion(nil, error);
    return;
  }

  NSURL *url = [NSURL URLWithString:kDeviceCheckinURL];
  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url];

  [request setValue:@"application/json" forHTTPHeaderField:@"content-type"];
  [request setValue:[FIRApp firebaseUserAgent]
      forHTTPHeaderField:kFIRInstanceIDFirebaseUserAgentKey];

  NSDictionary *checkinParameters = [self checkinParametersWithExistingCheckin:existingCheckin];
  NSData *checkinData = [NSJSONSerialization dataWithJSONObject:checkinParameters
                                                        options:0
                                                          error:nil];
  request.HTTPMethod = @"POST";
  request.HTTPBody = checkinData;

  void (^handler)(NSData *, NSURLResponse *, NSError *) =
      ^(NSData *data, NSURLResponse *response, NSError *error) {
        if (error) {
          FIRInstanceIDLoggerDebug(kFIRInstanceIDMessageCodeService000,
                                   @"Device checkin HTTP fetch error. Error Code: %ld",
                                   (long)error.code);
          completion(nil, error);
          return;
        }

        NSError *serializationError;
        NSDictionary *dataResponse = [NSJSONSerialization JSONObjectWithData:data
                                                                     options:0
                                                                       error:&serializationError];
        if (serializationError) {
          FIRInstanceIDLoggerDebug(kFIRInstanceIDMessageCodeService001,
                                   @"Error serializing json object. Error Code: %ld",
                                   _FIRInstanceID_L(serializationError.code));
          completion(nil, serializationError);
          return;
        }

        NSString *deviceAuthID = [dataResponse[@"android_id"] stringValue];
        NSString *secretToken = [dataResponse[@"security_token"] stringValue];
        if ([deviceAuthID length] == 0) {
          NSError *error =
              [NSError errorWithFIRInstanceIDErrorCode:kFIRInstanceIDErrorCodeInvalidRequest];
          completion(nil, error);
          return;
        }

        int64_t lastCheckinTimestampMillis = [dataResponse[@"time_msec"] longLongValue];
        int64_t currentTimestampMillis = FIRInstanceIDCurrentTimestampInMilliseconds();
        // Somehow the server clock gets out of sync with the device clock.
        // Reset the last checkin timestamp in case this happens.
        if (lastCheckinTimestampMillis > currentTimestampMillis) {
          FIRInstanceIDLoggerDebug(
              kFIRInstanceIDMessageCodeService002, @"Invalid last checkin timestamp %@ in future.",
              [NSDate dateWithTimeIntervalSince1970:lastCheckinTimestampMillis / 1000.0]);
          lastCheckinTimestampMillis = currentTimestampMillis;
        }

        NSString *deviceDataVersionInfo = dataResponse[@"device_data_version_info"] ?: @"";
        NSString *digest = dataResponse[@"digest"] ?: @"";

        FIRInstanceIDLoggerDebug(kFIRInstanceIDMessageCodeService003,
                                 @"Checkin successful with authId: %@, "
                                 @"digest: %@, "
                                 @"lastCheckinTimestamp: %lld",
                                 deviceAuthID, digest, lastCheckinTimestampMillis);

        NSString *versionInfo = dataResponse[@"version_info"] ?: @"";
        NSMutableDictionary *gservicesData = [NSMutableDictionary dictionary];

        // Read gServices data.
        NSArray *flatSettings = dataResponse[@"setting"];
        for (NSDictionary *dict in flatSettings) {
          if (dict[@"name"] && dict[@"value"]) {
            gservicesData[dict[@"name"]] = dict[@"value"];
          } else {
            _FIRInstanceIDDevAssert(NO, @"Invalid setting in checkin response: (%@: %@)",
                                    dict[@"name"], dict[@"value"]);
          }
        }

        FIRInstanceIDCheckinPreferences *checkinPreferences =
            [[FIRInstanceIDCheckinPreferences alloc] initWithDeviceID:deviceAuthID
                                                          secretToken:secretToken];
        NSDictionary *preferences = @{
          kFIRInstanceIDDigestStringKey : digest,
          kFIRInstanceIDVersionInfoStringKey : versionInfo,
          kFIRInstanceIDLastCheckinTimeKey : @(lastCheckinTimestampMillis),
          kFIRInstanceIDGServicesDictionaryKey : gservicesData,
          kFIRInstanceIDDeviceDataVersionKey : deviceDataVersionInfo,
        };
        [checkinPreferences updateWithCheckinPlistContents:preferences];
        completion(checkinPreferences, nil);
      };
  // Test block
  if (testBlock) {
    FIRInstanceIDLoggerDebug(kFIRInstanceIDMessageCodeService005,
                             @"Test block set, will not hit the server");
    testBlock(request, handler);
    return;
  }

  NSURLSessionDataTask *task = [self.session dataTaskWithRequest:request completionHandler:handler];
  [task resume];
}

- (void)stopFetching {
  [self.session invalidateAndCancel];
  // The session cannot be reused after invalidation. Dispose it to prevent accident reusing.
  self.session = nil;
}

#pragma mark - Private

- (NSDictionary *)checkinParametersWithExistingCheckin:
    (nullable FIRInstanceIDCheckinPreferences *)checkinPreferences {
  NSString *deviceModel = FIRInstanceIDDeviceModel();
  NSString *systemVersion = FIRInstanceIDOperatingSystemVersion();
  NSString *osVersion = [NSString stringWithFormat:@"IOS_%@", systemVersion];

  // Get locale from GCM if GCM exists else use system API.
  NSString *locale = FIRInstanceIDCurrentLocale();

  NSInteger userNumber = 0;        // Multi Profile may change this.
  NSInteger userSerialNumber = 0;  // Multi Profile may change this

  uint32_t loggingID = arc4random();
  NSString *timeZone = [NSTimeZone localTimeZone].name;
  int64_t lastCheckingTimestampMillis = checkinPreferences.lastCheckinTimestampMillis;

  NSDictionary *checkinParameters = @{
    @"checkin" : @{
      @"iosbuild" : @{@"model" : deviceModel, @"os_version" : osVersion},
      @"type" : @(kCheckinType),
      @"user_number" : @(userNumber),
      @"last_checkin_msec" : @(lastCheckingTimestampMillis),
    },
    @"fragment" : @(kFragment),
    @"logging_id" : @(loggingID),
    @"locale" : locale,
    @"version" : @(kCheckinVersion),
    @"digest" : checkinPreferences.digest ?: @"",
    @"timezone" : timeZone,
    @"user_serial_number" : @(userSerialNumber),
    @"id" : @([checkinPreferences.deviceID longLongValue]),
    @"security_token" : @([checkinPreferences.secretToken longLongValue]),
  };

  FIRInstanceIDLoggerDebug(kFIRInstanceIDMessageCodeService006, @"Checkin parameters: %@",
                           checkinParameters);
  return checkinParameters;
}

+ (void)setCheckinTestBlock:(FIRInstanceIDURLRequestTestBlock)block {
  testBlock = [block copy];
}

@end
