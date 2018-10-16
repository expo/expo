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

/// Error codes in Firebase Network error domain.
/// Note: these error codes should never change. It would make it harder to decode the errors if
/// we inadvertently altered any of these codes in a future SDK version.
typedef NS_ENUM(NSInteger, FIRNetworkErrorCode) {
  /// Unknown error.
  FIRNetworkErrorCodeUnknown = 0,
  /// Error occurs when the request URL is invalid.
  FIRErrorCodeNetworkInvalidURL = 1,
  /// Error occurs when request cannot be constructed.
  FIRErrorCodeNetworkRequestCreation = 2,
  /// Error occurs when payload cannot be compressed.
  FIRErrorCodeNetworkPayloadCompression = 3,
  /// Error occurs when session task cannot be created.
  FIRErrorCodeNetworkSessionTaskCreation = 4,
  /// Error occurs when there is no response.
  FIRErrorCodeNetworkInvalidResponse = 5
};

#pragma mark - Network constants

/// The prefix of the ID of the background session.
extern NSString *const kFIRNetworkBackgroundSessionConfigIDPrefix;

/// The sub directory to store the files of data that is being uploaded in the background.
extern NSString *const kFIRNetworkApplicationSupportSubdirectory;

/// Name of the temporary directory that stores files for background uploading.
extern NSString *const kFIRNetworkTempDirectoryName;

/// The period when the temporary uploading file can stay.
extern const NSTimeInterval kFIRNetworkTempFolderExpireTime;

/// The default network request timeout interval.
extern const NSTimeInterval kFIRNetworkTimeOutInterval;

/// The host to check the reachability of the network.
extern NSString *const kFIRNetworkReachabilityHost;

/// The key to get the error context of the UserInfo.
extern NSString *const kFIRNetworkErrorContext;

#pragma mark - Network Status Code

extern const int kFIRNetworkHTTPStatusOK;
extern const int kFIRNetworkHTTPStatusNoContent;
extern const int kFIRNetworkHTTPStatusCodeMultipleChoices;
extern const int kFIRNetworkHTTPStatusCodeMovedPermanently;
extern const int kFIRNetworkHTTPStatusCodeFound;
extern const int kFIRNetworkHTTPStatusCodeNotModified;
extern const int kFIRNetworkHTTPStatusCodeMovedTemporarily;
extern const int kFIRNetworkHTTPStatusCodeNotFound;
extern const int kFIRNetworkHTTPStatusCodeCannotAcceptTraffic;
extern const int kFIRNetworkHTTPStatusCodeUnavailable;

#pragma mark - Error Domain

extern NSString *const kFIRNetworkErrorDomain;
