// Copyright 2017 Google
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#import "GoogleUtilities/Network/Private/GULNetworkConstants.h"

#import <Foundation/Foundation.h>

NSString *const kGULNetworkBackgroundSessionConfigIDPrefix = @"com.gul.network.background-upload";
NSString *const kGULNetworkApplicationSupportSubdirectory = @"GUL/Network";
NSString *const kGULNetworkTempDirectoryName = @"GULNetworkTemporaryDirectory";
const NSTimeInterval kGULNetworkTempFolderExpireTime = 60 * 60;  // 1 hour
const NSTimeInterval kGULNetworkTimeOutInterval = 60;            // 1 minute.
NSString *const kGULNetworkReachabilityHost = @"app-measurement.com";
NSString *const kGULNetworkErrorContext = @"Context";

const int kGULNetworkHTTPStatusOK = 200;
const int kGULNetworkHTTPStatusNoContent = 204;
const int kGULNetworkHTTPStatusCodeMultipleChoices = 300;
const int kGULNetworkHTTPStatusCodeMovedPermanently = 301;
const int kGULNetworkHTTPStatusCodeFound = 302;
const int kGULNetworkHTTPStatusCodeNotModified = 304;
const int kGULNetworkHTTPStatusCodeMovedTemporarily = 307;
const int kGULNetworkHTTPStatusCodeNotFound = 404;
const int kGULNetworkHTTPStatusCodeCannotAcceptTraffic = 429;
const int kGULNetworkHTTPStatusCodeUnavailable = 503;

NSString *const kGULNetworkErrorDomain = @"com.gul.network.ErrorDomain";

GULLoggerService kGULLoggerNetwork = @"[GULNetwork]";
