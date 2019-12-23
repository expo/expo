/*
 * Copyright 2017 Google
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
 * This class provides constant fields of Google APIs.
 */
NS_SWIFT_NAME(FirebaseOptions)
@interface FIROptions : NSObject <NSCopying>

/**
 * Returns the default options. The first time this is called it synchronously reads
 * GoogleService-Info.plist from disk.
 */
+ (nullable FIROptions *)defaultOptions NS_SWIFT_NAME(defaultOptions());

/**
 * An iOS API key used for authenticating requests from your app, e.g.
 * @"AIzaSyDdVgKwhZl0sTTTLZ7iTmt1r3N2cJLnaDk", used to identify your app to Google servers.
 */
@property(nonatomic, copy, nullable) NSString *APIKey NS_SWIFT_NAME(apiKey);

/**
 * The bundle ID for the application. Defaults to `[[NSBundle mainBundle] bundleID]` when not set
 * manually or in a plist.
 */
@property(nonatomic, copy) NSString *bundleID;

/**
 * The OAuth2 client ID for iOS application used to authenticate Google users, for example
 * @"12345.apps.googleusercontent.com", used for signing in with Google.
 */
@property(nonatomic, copy, nullable) NSString *clientID;

/**
 * The tracking ID for Google Analytics, e.g. @"UA-12345678-1", used to configure Google Analytics.
 */
@property(nonatomic, copy, nullable) NSString *trackingID;

/**
 * The Project Number from the Google Developer's console, for example @"012345678901", used to
 * configure Google Cloud Messaging.
 */
@property(nonatomic, copy) NSString *GCMSenderID NS_SWIFT_NAME(gcmSenderID);

/**
 * The Project ID from the Firebase console, for example @"abc-xyz-123".
 */
@property(nonatomic, copy, nullable) NSString *projectID;

/**
 * The Android client ID used in Google AppInvite when an iOS app has its Android version, for
 * example @"12345.apps.googleusercontent.com".
 */
@property(nonatomic, copy, nullable) NSString *androidClientID;

/**
 * The Google App ID that is used to uniquely identify an instance of an app.
 */
@property(nonatomic, copy) NSString *googleAppID;

/**
 * The database root URL, e.g. @"http://abc-xyz-123.firebaseio.com".
 */
@property(nonatomic, copy, nullable) NSString *databaseURL;

/**
 * The URL scheme used to set up Durable Deep Link service.
 */
@property(nonatomic, copy, nullable) NSString *deepLinkURLScheme;

/**
 * The Google Cloud Storage bucket name, e.g. @"abc-xyz-123.storage.firebase.com".
 */
@property(nonatomic, copy, nullable) NSString *storageBucket;

/**
 * The App Group identifier to share data between the application and the application extensions.
 * The App Group must be configured in the application and on the Apple Developer Portal. Default
 * value `nil`.
 */
@property(nonatomic, copy, nullable) NSString *appGroupID;

/**
 * Initializes a customized instance of FIROptions from the file at the given plist file path. This
 * will read the file synchronously from disk.
 * For example,
 * NSString *filePath =
 *     [[NSBundle mainBundle] pathForResource:@"GoogleService-Info" ofType:@"plist"];
 * FIROptions *options = [[FIROptions alloc] initWithContentsOfFile:filePath];
 * Returns nil if the plist file does not exist or is invalid.
 */
- (nullable instancetype)initWithContentsOfFile:(NSString *)plistPath;

/**
 * Initializes a customized instance of FIROptions with required fields. Use the mutable properties
 * to modify fields for configuring specific services.
 */
// clang-format off
- (instancetype)initWithGoogleAppID:(NSString *)googleAppID
                        GCMSenderID:(NSString *)GCMSenderID
    NS_SWIFT_NAME(init(googleAppID:gcmSenderID:));
// clang-format on

@end

NS_ASSUME_NONNULL_END
