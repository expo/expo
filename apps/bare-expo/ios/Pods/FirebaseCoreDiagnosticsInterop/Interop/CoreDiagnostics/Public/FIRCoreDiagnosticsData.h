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

/** If present, is a BOOL wrapped in an NSNumber. */
#define kFIRCDIsDataCollectionDefaultEnabledKey @"FIRCDIsDataCollectionDefaultEnabledKey"

/** If present, is an int32_t wrapped in an NSNumber. */
#define kFIRCDConfigurationTypeKey @"FIRCDConfigurationTypeKey"

/** If present, is an NSString. */
#define kFIRCDSdkNameKey @"FIRCDSdkNameKey"

/** If present, is an NSString. */
#define kFIRCDSdkVersionKey @"FIRCDSdkVersionKey"

/** If present, is an int32_t wrapped in an NSNumber. */
#define kFIRCDllAppsCountKey @"FIRCDllAppsCountKey"

/** If present, is an NSString. */
#define kFIRCDGoogleAppIDKey @"FIRCDGoogleAppIDKey"

/** If present, is an NSString. */
#define kFIRCDBundleIDKey @"FIRCDBundleID"

/** If present, is a BOOL wrapped in an NSNumber. */
#define kFIRCDUsingOptionsFromDefaultPlistKey @"FIRCDUsingOptionsFromDefaultPlistKey"

/** If present, is an NSString. */
#define kFIRCDLibraryVersionIDKey @"FIRCDLibraryVersionIDKey"

/** If present, is an NSString. */
#define kFIRCDFirebaseUserAgentKey @"FIRCDFirebaseUserAgentKey"

/** Defines the interface of a data object needed to log diagnostics data. */
@protocol FIRCoreDiagnosticsData <NSObject>

@required

/** A dictionary containing data (non-exhaustive) to be logged in diagnostics. */
@property(nonatomic) NSDictionary<NSString *, id> *diagnosticObjects;

@end

NS_ASSUME_NONNULL_END
