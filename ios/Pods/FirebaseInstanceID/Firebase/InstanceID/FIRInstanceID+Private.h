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

#import "FIRInstanceID.h"

#import "FIRInstanceIDCheckinService.h"

/**
 * Internal API used by other Firebase SDK teams, including Messaging, Analytics and Remote config.
 */
@interface FIRInstanceID (Private)

/**
 *  Return the cached checkin preferences on the disk. This is used internally only by Messaging.
 *
 *  @return The cached checkin preferences on the client.
 */
- (nullable FIRInstanceIDCheckinPreferences *)cachedCheckinPreferences;

/**
 *  Fetches checkin info for the app. If the app has valid cached checkin preferences
 *  they are returned instead of making a network request.
 *
 *  @param handler The completion handler to invoke once the request has completed.
 */
- (void)fetchCheckinInfoWithHandler:(nullable FIRInstanceIDDeviceCheckinCompletion)handler;

/**
 *  Get the InstanceID for the app. If an ID was created before and cached
 *  successfully we will return that ID. If no cached ID exists we create
 *  a new ID, cache it and return that.
 *
 *  This is a blocking call and should not really be called on the main thread.
 *
 *  @param error The error object that represents the error while trying to
 *               retrieve the instance id.
 *
 *  @return The InstanceID for the app.
 */
- (nullable NSString *)appInstanceID:(NSError *_Nullable *_Nullable)error;

@end
