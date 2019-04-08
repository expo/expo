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

/**
 *  The preferences InstanceID loads from checkin server. The deviceID and secret that checkin
 *  provides is used to authenticate all future requests to the server. Besides the deviceID
 *  and secret the other information that checkin provides is stored in a plist on the device.
 *  The deviceID and secret are persisted in the device keychain.
 */
@interface FIRInstanceIDCheckinPreferences : NSObject

/**
 *  DeviceID and secretToken are the checkin auth credentials and are stored in the Keychain.
 */
@property(nonatomic, readonly, copy) NSString *deviceID;
@property(nonatomic, readonly, copy) NSString *secretToken;

/**
 *  All the other checkin preferences other than deviceID and secret are stored in a plist.
 */
@property(nonatomic, readonly, copy) NSString *deviceDataVersion;
@property(nonatomic, readonly, copy) NSString *digest;
@property(nonatomic, readonly, copy) NSString *versionInfo;
@property(nonatomic, readonly, strong) NSMutableDictionary *gServicesData;
@property(nonatomic, readonly, assign) int64_t lastCheckinTimestampMillis;

/**
 *  The content retrieved from checkin server that should be persisted in a plist. This
 *  doesn't contain the deviceID and secret which are stored in the Keychain since they
 *  should be more private.
 *
 *  @return The checkin preferences that should be persisted in a plist.
 */
- (NSDictionary *)checkinPlistContents;

/**
 *  Return whether checkin info exists, valid or not.
 */
- (BOOL)hasCheckinInfo;

/**
 *  Verify if checkin preferences are valid or not.
 *
 *  @return YES if valid checkin preferences else NO.
 */
- (BOOL)hasValidCheckinInfo;

@end
