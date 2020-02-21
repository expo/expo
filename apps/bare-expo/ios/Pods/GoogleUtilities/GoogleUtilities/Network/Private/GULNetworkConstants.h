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
#import <GoogleUtilities/GULLogger.h>

/// Error codes in Firebase Network error domain.
/// Note: these error codes should never change. It would make it harder to decode the errors if
/// we inadvertently altered any of these codes in a future SDK version.
typedef NS_ENUM(NSInteger, GULNetworkErrorCode) {
  /// Unknown error.
  GULNetworkErrorCodeUnknown = 0,
  /// Error occurs when the request URL is invalid.
  GULErrorCodeNetworkInvalidURL = 1,
  /// Error occurs when request cannot be constructed.
  GULErrorCodeNetworkRequestCreation = 2,
  /// Error occurs when payload cannot be compressed.
  GULErrorCodeNetworkPayloadCompression = 3,
  /// Error occurs when session task cannot be created.
  GULErrorCodeNetworkSessionTaskCreation = 4,
  /// Error occurs when there is no response.
  GULErrorCodeNetworkInvalidResponse = 5
};

#pragma mark - Network constants

/// The prefix of the ID of the background session.
extern NSString *const kGULNetworkBackgroundSessionConfigIDPrefix;

/// The sub directory to store the files of data that is being uploaded in the background.
extern NSString *const kGULNetworkApplicationSupportSubdirectory;

/// Name of the temporary directory that stores files for background uploading.
extern NSString *const kGULNetworkTempDirectoryName;

/// The period when the temporary uploading file can stay.
extern const NSTimeInterval kGULNetworkTempFolderExpireTime;

/// The default network request timeout interval.
extern const NSTimeInterval kGULNetworkTimeOutInterval;

/// The host to check the reachability of the network.
extern NSString *const kGULNetworkReachabilityHost;

/// The key to get the error context of the UserInfo.
extern NSString *const kGULNetworkErrorContext;

#pragma mark - Network Status Code

extern const int kGULNetworkHTTPStatusOK;
extern const int kGULNetworkHTTPStatusNoContent;
extern const int kGULNetworkHTTPStatusCodeMultipleChoices;
extern const int kGULNetworkHTTPStatusCodeMovedPermanently;
extern const int kGULNetworkHTTPStatusCodeFound;
extern const int kGULNetworkHTTPStatusCodeNotModified;
extern const int kGULNetworkHTTPStatusCodeMovedTemporarily;
extern const int kGULNetworkHTTPStatusCodeNotFound;
extern const int kGULNetworkHTTPStatusCodeCannotAcceptTraffic;
extern const int kGULNetworkHTTPStatusCodeUnavailable;

#pragma mark - Error Domain

extern NSString *const kGULNetworkErrorDomain;

/// The logger service for GULNetwork.
extern GULLoggerService kGULLoggerNetwork;
