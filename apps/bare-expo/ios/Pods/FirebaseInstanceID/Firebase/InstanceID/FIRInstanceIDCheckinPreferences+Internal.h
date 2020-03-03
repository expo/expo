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

#import <FirebaseInstanceID/FIRInstanceIDCheckinPreferences.h>

@interface FIRInstanceIDCheckinPreferences (Internal)

/**
 *  Parse the checkin auth credentials saved in the Keychain to initialize checkin
 *  preferences.
 *
 *  @param keychainContent The checkin auth credentials saved in the Keychain.
 *
 *  @return A valid checkin preferences object if the checkin auth credentials in the
 *          keychain can be parsed successfully else nil.
 */
+ (FIRInstanceIDCheckinPreferences *)preferencesFromKeychainContents:(NSString *)keychainContent;

/**
 *  Default initializer for InstanceID checkin preferences.
 *
 *  @param deviceID    The deviceID for the app.
 *  @param secretToken The secret token the app uses to authenticate with the server.
 *
 *  @return A checkin preferences object with given deviceID and secretToken.
 */
- (instancetype)initWithDeviceID:(NSString *)deviceID secretToken:(NSString *)secretToken;

/**
 *  Update checkin preferences from the preferences dict persisted as a plist. The dict contains
 *  all the checkin preferences retrieved from the server except the deviceID and secret which
 *  are stored in the Keychain.
 *
 *  @param checkinPlistContent The checkin preferences saved in a plist on the disk.
 */
- (void)updateWithCheckinPlistContents:(NSDictionary *)checkinPlistContent;

/**
 *  Reset the current checkin preferences object.
 */
- (void)reset;

/**
 *  The string that contains the checkin auth credentials i.e. deviceID and secret. This
 *  needs to be stored in the Keychain.
 *
 *  @return The checkin auth credential string containing the deviceID and secret.
 */
- (NSString *)checkinKeychainContent;

@end
