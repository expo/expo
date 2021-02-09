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

NS_ASSUME_NONNULL_BEGIN

/**
 *  Represents an APNS device token and whether its environment is for sandbox.
 *  It can read from and write to an NSDictionary for simple serialization.
 */
@interface FIRInstanceIDAPNSInfo : NSObject <NSCoding>

/// The APNs device token, provided by the OS to the application delegate
@property(nonatomic, readonly, strong) NSData *deviceToken;
/// Represents whether or not this is deviceToken is for the sandbox
/// environment, or production.
@property(nonatomic, readonly, getter=isSandbox) BOOL sandbox;

/**
 *  Initializes the receiver with an APNs device token, and boolean
 *  representing whether that token is for the sandbox environment.
 *
 *  @param deviceToken The APNs device token typically provided by the
 *         operating system.
 *  @param isSandbox   YES if the APNs device token is for the sandbox
 *                     environment, or NO if it is for production.
 *  @return An instance of FIRInstanceIDAPNSInfo.
 */
- (instancetype)initWithDeviceToken:(NSData *)deviceToken isSandbox:(BOOL)isSandbox;

/**
 *  Initializes the receiver from a token options dictionary containing data
 *  within the `kFIRInstanceIDTokenOptionsAPNSKey` and
 *  `kFIRInstanceIDTokenOptionsAPNSIsSandboxKey` keys. The token should be an
 *  NSData blob, and the sandbox value should be an NSNumber
 *  representing a boolean value.
 *
 *  @param dictionary A dictionary containing values under the keys
 *          `kFIRInstanceIDTokenOptionsAPNSKey` and
 *          `kFIRInstanceIDTokenOptionsAPNSIsSandboxKey`.
 *  @return An instance of FIRInstanceIDAPNSInfo, or nil if the
 *          dictionary data was invalid or missing.
 */
- (nullable instancetype)initWithTokenOptionsDictionary:(NSDictionary *)dictionary;

- (BOOL)isEqualToAPNSInfo:(FIRInstanceIDAPNSInfo *)otherInfo;

@end

NS_ASSUME_NONNULL_END
