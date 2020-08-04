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

#import <FirebaseInstanceID/FIRInstanceID.h>
#import <FirebaseInstanceID/FIRInstanceIDCheckinPreferences.h>

/**
 *  @related FIRInstanceIDCheckinService
 *
 *  The completion handler invoked once the fetch from Checkin server finishes.
 *  For successful fetches we returned checkin information by the checkin service
 *  and `nil` error, else we return the appropriate error object as reported by the
 *  Checkin Service.
 *
 *  @param checkinPreferences The checkin preferences as fetched from the server.
 *  @param error              The error object which fetching GServices data.
 */
typedef void (^FIRInstanceIDDeviceCheckinCompletion)(
    FIRInstanceIDCheckinPreferences *_Nullable checkinPreferences, NSError *_Nullable error);

/**
 * Private API used by Firebase SDK teams by calling in reflection or internal teams.
 */
@interface FIRInstanceID (Private)

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
