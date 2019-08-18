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
#import "FIRInstanceIDCheckinService.h"

@class FIRInstanceIDCheckinPreferences;
@class FIRInstanceIDStore;

/**
 *  FIRInstanceIDAuthService is responsible for retrieving, caching, and supplying checkin info
 *  for the rest of Instance ID. A checkin can be scheduled, meaning that it will keep retrying the
 *  checkin request until it is successful. A checkin can also be requested directly, with a
 *  completion handler.
 */
@interface FIRInstanceIDAuthService : NSObject

/**
 *  Used only for testing. In addition to taking a store (for locally caching the checkin info), it
 *  also takes a checkinService.
 */
- (instancetype)initWithCheckinService:(FIRInstanceIDCheckinService *)checkinService
                                 store:(FIRInstanceIDStore *)store;

/**
 *  Initializes the auth service given a store (which provides the local caching of checkin info).
 *  This initializer will create its own instance of FIRInstanceIDCheckinService.
 */
- (instancetype)initWithStore:(FIRInstanceIDStore *)store;

#pragma mark - Checkin Service

/**
 *  Checks if the current deviceID and secret are valid or not.
 *
 *  @return YES if the checkin credentials are valid else NO.
 */
- (BOOL)hasValidCheckinInfo;

/**
 *  Fetch checkin info from the server. This would usually refresh the existing
 *  checkin credentials for the current app.
 *
 *  @param handler The completion handler to invoke once the checkin info has been
 *                 refreshed.
 */
- (void)fetchCheckinInfoWithHandler:(FIRInstanceIDDeviceCheckinCompletion)handler;

/**
 *  Schedule checkin. Will hit the network only if the currently loaded checkin
 *  preferences are stale.
 *
 *  @param immediately YES if we want it to be scheduled immediately else NO.
 */
- (void)scheduleCheckin:(BOOL)immediately;

/**
 *  Returns the checkin preferences currently loaded in memory. The Checkin preferences
 *  can be either valid or invalid.
 *
 *  @return The checkin preferences loaded in memory.
 */
- (FIRInstanceIDCheckinPreferences *)checkinPreferences;

/**
 *  Cancels any ongoing checkin fetch, if any.
 */
- (void)stopCheckinRequest;

/**
 *  Resets the checkin information.
 *
 *  @param handler       The callback handler which is invoked when checkin reset is complete,
 *                       with an error if there is any.
 */
- (void)resetCheckinWithHandler:(void (^)(NSError *error))handler;

@end
