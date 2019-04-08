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

#import "FIROptions.h"

/**
 * Keys for the strings in the plist file.
 */
extern NSString *const kFIRAPIKey;
extern NSString *const kFIRTrackingID;
extern NSString *const kFIRGoogleAppID;
extern NSString *const kFIRClientID;
extern NSString *const kFIRGCMSenderID;
extern NSString *const kFIRAndroidClientID;
extern NSString *const kFIRDatabaseURL;
extern NSString *const kFIRStorageBucket;
extern NSString *const kFIRBundleID;
extern NSString *const kFIRProjectID;

/**
 * Keys for the plist file name
 */
extern NSString *const kServiceInfoFileName;

extern NSString *const kServiceInfoFileType;

/**
 * This header file exposes the initialization of FIROptions to internal use.
 */
@interface FIROptions ()

/**
 * resetDefaultOptions and initInternalWithOptionsDictionary: are exposed only for unit tests.
 */
+ (void)resetDefaultOptions;

/**
 * Initializes the options with dictionary. The above strings are the keys of the dictionary.
 * This is the designated initializer.
 */
- (instancetype)initInternalWithOptionsDictionary:(NSDictionary *)serviceInfoDictionary;

/**
 * defaultOptions and defaultOptionsDictionary are exposed in order to be used in FIRApp and
 * other first party services.
 */
+ (FIROptions *)defaultOptions;

+ (NSDictionary *)defaultOptionsDictionary;

/**
 * Indicates whether or not Analytics collection was explicitly enabled via a plist flag or at
 * runtime.
 */
@property(nonatomic, readonly) BOOL isAnalyticsCollectionExpicitlySet;

/**
 * Whether or not Analytics Collection was enabled. Analytics Collection is enabled unless
 * explicitly disabled in GoogleService-Info.plist.
 */
@property(nonatomic, readonly) BOOL isAnalyticsCollectionEnabled;

/**
 * Whether or not Analytics Collection was completely disabled. If YES, then
 * isAnalyticsCollectionEnabled will be NO.
 */
@property(nonatomic, readonly) BOOL isAnalyticsCollectionDeactivated;

/**
 * The version ID of the client library, e.g. @"1100000".
 */
@property(nonatomic, readonly, copy) NSString *libraryVersionID;

/**
 * The flag indicating whether this object was constructed with the values in the default plist
 * file.
 */
@property(nonatomic) BOOL usingOptionsFromDefaultPlist;

/**
 * Whether or not Measurement was enabled. Measurement is enabled unless explicitly disabled in
 * GoogleService-Info.plist.
 */
@property(nonatomic, readonly) BOOL isMeasurementEnabled;

/**
 * Whether or not Analytics was enabled in the developer console.
 */
@property(nonatomic, readonly) BOOL isAnalyticsEnabled;

/**
 * Whether or not SignIn was enabled in the developer console.
 */
@property(nonatomic, readonly) BOOL isSignInEnabled;

/**
 * Whether or not editing is locked. This should occur after FIROptions has been set on a FIRApp.
 */
@property(nonatomic, getter=isEditingLocked) BOOL editingLocked;

@end
