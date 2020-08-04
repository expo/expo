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

#import "FIRInstanceIDConstants.h"

// Commands
NSString *const kFIRInstanceID_CMD_RST = @"RST";

// NOTIFICATIONS
NSString *const kFIRInstanceIDCheckinFetchedNotification = @"com.google.gcm.notif-checkin-fetched";
NSString *const kFIRInstanceIDAPNSTokenNotification = @"com.firebase.iid.notif.apns-token";
NSString *const kFIRInstanceIDDefaultGCMTokenNotification = @"com.firebase.iid.notif.fcm-token";
NSString *const kFIRInstanceIDDefaultGCMTokenFailNotification =
    @"com.firebase.iid.notif.fcm-token-fail";

NSString *const kFIRInstanceIDIdentityInvalidatedNotification = @"com.google.iid.identity-invalid";

// Miscellaneous
NSString *const kFIRInstanceIDAllScopeIdentifier = @"iid-all";
NSString *const kFIRInstanceIDDefaultTokenScope = @"*";
NSString *const kFIRInstanceIDSubDirectoryName = @"Google/FirebaseInstanceID";

// Registration Options
NSString *const kFIRInstanceIDTokenOptionsAPNSKey = @"apns_token";
NSString *const kFIRInstanceIDTokenOptionsAPNSIsSandboxKey = @"apns_sandbox";
NSString *const kFIRInstanceIDTokenOptionsFirebaseAppIDKey = @"gmp_app_id";

NSString *const kFIRInstanceIDAppDelegateProxyEnabledInfoPlistKey =
    @"FirebaseAppDelegateProxyEnabled";

// iOS Keychain error https://forums.developer.apple.com/thread/4743
// An undocumented error code hence need to be redeclared.
const int kFIRInstanceIDSecMissingEntitlementErrorCode = -34018;
