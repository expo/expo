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

#pragma mark - Commands

/**
 *  Value included in a structured response or GCM message from IID, indicating
 *  an identity reset.
 */
FOUNDATION_EXPORT NSString *const kFIRInstanceID_CMD_RST;

#pragma mark - Notifications

/// Notification used to deliver GCM messages for InstanceID.
FOUNDATION_EXPORT NSString *const kFIRInstanceIDCheckinFetchedNotification;
FOUNDATION_EXPORT NSString *const kFIRInstanceIDAPNSTokenNotification;
FOUNDATION_EXPORT NSString *const kFIRInstanceIDDefaultGCMTokenNotification;
FOUNDATION_EXPORT NSString *const kFIRInstanceIDDefaultGCMTokenFailNotification;

FOUNDATION_EXPORT NSString *const kFIRInstanceIDIdentityInvalidatedNotification;

#pragma mark - Miscellaneous

/// The scope used to save the IID "*" scope token. This is used for saving the
/// IID auth token that we receive from the server. This feature was never
/// implemented on the server side.
FOUNDATION_EXPORT NSString *const kFIRInstanceIDAllScopeIdentifier;
/// The scope used to save the IID "*" scope token.
FOUNDATION_EXPORT NSString *const kFIRInstanceIDDefaultTokenScope;

/// Subdirectory in search path directory to store InstanceID preferences.
FOUNDATION_EXPORT NSString *const kFIRInstanceIDSubDirectoryName;

/// The key for APNS token in options dictionary.
FOUNDATION_EXPORT NSString *const kFIRInstanceIDTokenOptionsAPNSKey;

/// The key for APNS token environment type in options dictionary.
FOUNDATION_EXPORT NSString *const kFIRInstanceIDTokenOptionsAPNSIsSandboxKey;

/// The key for GMP AppID sent in registration requests.
FOUNDATION_EXPORT NSString *const kFIRInstanceIDTokenOptionsFirebaseAppIDKey;

/// The key to enable auto-register by swizzling AppDelegate's methods.
FOUNDATION_EXPORT NSString *const kFIRInstanceIDAppDelegateProxyEnabledInfoPlistKey;

/// Error code for missing entitlements in Keychain. iOS Keychain error
/// https://forums.developer.apple.com/thread/4743
FOUNDATION_EXPORT const int kFIRInstanceIDSecMissingEntitlementErrorCode;
