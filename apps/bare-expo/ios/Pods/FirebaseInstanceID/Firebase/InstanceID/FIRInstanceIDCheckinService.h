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

#import <Foundation/Foundation.h>

#import <FirebaseInstanceID/FIRInstanceID+Private.h>
#import "FIRInstanceIDUtilities.h"

NS_ASSUME_NONNULL_BEGIN

// keys in Checkin preferences
FOUNDATION_EXPORT NSString *const kFIRInstanceIDDeviceAuthIdKey;
FOUNDATION_EXPORT NSString *const kFIRInstanceIDSecretTokenKey;
FOUNDATION_EXPORT NSString *const kFIRInstanceIDDigestStringKey;
FOUNDATION_EXPORT NSString *const kFIRInstanceIDLastCheckinTimeKey;
FOUNDATION_EXPORT NSString *const kFIRInstanceIDVersionInfoStringKey;
FOUNDATION_EXPORT NSString *const kFIRInstanceIDGServicesDictionaryKey;
FOUNDATION_EXPORT NSString *const kFIRInstanceIDDeviceDataVersionKey;

@class FIRInstanceIDCheckinPreferences;

/**
 *  Register the device with Checkin Service and get back the `authID`, `secret
 *  token` etc. for the client. Checkin results are cached in the
 *  `FIRInstanceIDCache` and periodically refreshed to prevent them from being stale.
 *  Each client needs to register with checkin before registering with InstanceID.
 */
@interface FIRInstanceIDCheckinService : NSObject

/**
 *  Execute a device checkin request to obtain an deviceID, secret token,
 *  gService data.
 *
 *  @param existingCheckin An existing checkin preference object, if available.
 *  @param completion Completion hander called on success or failure of device checkin.
 */
- (void)checkinWithExistingCheckin:(nullable FIRInstanceIDCheckinPreferences *)existingCheckin
                        completion:(FIRInstanceIDDeviceCheckinCompletion)completion;

/**
 *  This would stop any request that the service made to the checkin backend and also
 *  release any callback handlers that it holds.
 */
- (void)stopFetching;

/**
 *  Set test block for mock testing network requests.
 *
 *  @param block The block to invoke as a mock response from the network.
 */
+ (void)setCheckinTestBlock:(nullable FIRInstanceIDURLRequestTestBlock)block;

@end

NS_ASSUME_NONNULL_END
