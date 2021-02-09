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

/// FIRMessaging Class that responds to the FIRMessaging SDK version selector.
/// Verify at runtime if the class exists and implements the required method.
FOUNDATION_EXPORT NSString *const kFIRInstanceIDFCMSDKClassString;

/// locale key stored in GULUserDefaults
FOUNDATION_EXPORT NSString *const kFIRInstanceIDUserDefaultsKeyLocale;

#pragma mark - Test Blocks

/**
 *  Response block for mock registration requests made during tests.
 *
 *  @param data     The data as returned by the mock request.
 *  @param response The response as returned by the mock request.
 *  @param error    The error if any as returned by the mock request.
 */
typedef void (^FIRInstanceIDURLRequestTestResponseBlock)(NSData *data,
                                                         NSURLResponse *response,
                                                         NSError *error);

/**
 *  Test block to mock registration requests response.
 *
 *  @param request  The request to mock response for.
 *  @param response The response block for the mocked request.
 */
typedef void (^FIRInstanceIDURLRequestTestBlock)(NSURLRequest *request,
                                                 FIRInstanceIDURLRequestTestResponseBlock response);

#pragma mark - URL Helpers

FOUNDATION_EXPORT NSString *FIRInstanceIDRegisterServer(void);

#pragma mark - Time

FOUNDATION_EXPORT int64_t FIRInstanceIDCurrentTimestampInSeconds(void);
FOUNDATION_EXPORT int64_t FIRInstanceIDCurrentTimestampInMilliseconds(void);

#pragma mark - App Info

FOUNDATION_EXPORT NSString *FIRInstanceIDCurrentAppVersion(void);
FOUNDATION_EXPORT NSString *FIRInstanceIDAppIdentifier(void);
FOUNDATION_EXPORT NSString *FIRInstanceIDFirebaseAppID(void);

#pragma mark - Device Info

FOUNDATION_EXPORT NSString *FIRInstanceIDDeviceModel(void);
FOUNDATION_EXPORT NSString *FIRInstanceIDOperatingSystemVersion(void);
FOUNDATION_EXPORT BOOL FIRInstanceIDHasLocaleChanged(void);

#pragma mark - Helpers

FOUNDATION_EXPORT BOOL FIRInstanceIDIsValidGCMScope(NSString *scope);
FOUNDATION_EXPORT NSString *FIRInstanceIDStringForAPNSDeviceToken(NSData *deviceToken);
FOUNDATION_EXPORT NSString *FIRInstanceIDAPNSTupleStringForTokenAndServerType(NSData *deviceToken,
                                                                              BOOL isSandbox);

#pragma mark - GCM Helpers
/// Returns the current GCM version if GCM library is found else returns nil.
FOUNDATION_EXPORT NSString *FIRInstanceIDCurrentGCMVersion(void);

/// Returns the current locale. If GCM is present it queries GCM for a
/// Context Manager specific locale. Otherwise, it returns the system's first
/// preferred language (which may be set independently from locale). If the
/// system returns no preferred languages, this method returns the most common
/// language for the user's given locale. Guaranteed to return a nonnull value.
FOUNDATION_EXPORT NSString *FIRInstanceIDCurrentLocale(void);
