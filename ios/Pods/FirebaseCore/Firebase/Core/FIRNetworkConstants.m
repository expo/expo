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

#import "Private/FIRNetworkConstants.h"

#import <Foundation/Foundation.h>

NSString *const kFIRNetworkBackgroundSessionConfigIDPrefix =
    @"com.firebase.network.background-upload";
NSString *const kFIRNetworkApplicationSupportSubdirectory = @"Firebase/Network";
NSString *const kFIRNetworkTempDirectoryName = @"FIRNetworkTemporaryDirectory";
const NSTimeInterval kFIRNetworkTempFolderExpireTime = 60 * 60;  // 1 hour
const NSTimeInterval kFIRNetworkTimeOutInterval = 60;            // 1 minute.
NSString *const kFIRNetworkReachabilityHost = @"app-measurement.com";
NSString *const kFIRNetworkErrorContext = @"Context";

const int kFIRNetworkHTTPStatusOK = 200;
const int kFIRNetworkHTTPStatusNoContent = 204;
const int kFIRNetworkHTTPStatusCodeMultipleChoices = 300;
const int kFIRNetworkHTTPStatusCodeMovedPermanently = 301;
const int kFIRNetworkHTTPStatusCodeFound = 302;
const int kFIRNetworkHTTPStatusCodeNotModified = 304;
const int kFIRNetworkHTTPStatusCodeMovedTemporarily = 307;
const int kFIRNetworkHTTPStatusCodeNotFound = 404;
const int kFIRNetworkHTTPStatusCodeCannotAcceptTraffic = 429;
const int kFIRNetworkHTTPStatusCodeUnavailable = 503;

NSString *const kFIRNetworkErrorDomain = @"com.firebase.network.ErrorDomain";
