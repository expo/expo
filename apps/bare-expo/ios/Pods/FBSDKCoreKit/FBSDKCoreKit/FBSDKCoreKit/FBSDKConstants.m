// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
//
// You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
// copy, modify, and distribute this software in source code or binary form for use
// in connection with the web services and APIs provided by Facebook.
//
// As with any software that integrates with the Facebook platform, your use of
// this software is subject to the Facebook Developer Principles and Policies
// [http://developers.facebook.com/policy/]. This copyright notice shall be
// included in all copies or substantial portions of the software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

#import "FBSDKConstants.h"

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_10_0

NSErrorDomain const FBSDKErrorDomain = @"com.facebook.sdk.core";

#else

NSString *const FBSDKErrorDomain = @"com.facebook.sdk.core";

#endif

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_10_0

NSErrorUserInfoKey const FBSDKErrorArgumentCollectionKey = @"com.facebook.sdk:FBSDKErrorArgumentCollectionKey";
NSErrorUserInfoKey const FBSDKErrorArgumentNameKey = @"com.facebook.sdk:FBSDKErrorArgumentNameKey";
NSErrorUserInfoKey const FBSDKErrorArgumentValueKey = @"com.facebook.sdk:FBSDKErrorArgumentValueKey";
NSErrorUserInfoKey const FBSDKErrorDeveloperMessageKey = @"com.facebook.sdk:FBSDKErrorDeveloperMessageKey";
NSErrorUserInfoKey const FBSDKErrorLocalizedDescriptionKey = @"com.facebook.sdk:FBSDKErrorLocalizedDescriptionKey";
NSErrorUserInfoKey const FBSDKErrorLocalizedTitleKey = @"com.facebook.sdk:FBSDKErrorLocalizedErrorTitleKey";

NSErrorUserInfoKey const FBSDKGraphRequestErrorKey = @"com.facebook.sdk:FBSDKGraphRequestErrorKey";
NSErrorUserInfoKey const FBSDKGraphRequestErrorCategoryKey = @"com.facebook.sdk:FBSDKGraphRequestErrorCategoryKey";
NSErrorUserInfoKey const FBSDKGraphRequestErrorGraphErrorCodeKey = @"com.facebook.sdk:FBSDKGraphRequestErrorGraphErrorCodeKey";
NSErrorUserInfoKey const FBSDKGraphRequestErrorGraphErrorSubcodeKey = @"com.facebook.sdk:FBSDKGraphRequestErrorGraphErrorSubcodeKey";
NSErrorUserInfoKey const FBSDKGraphRequestErrorHTTPStatusCodeKey = @"com.facebook.sdk:FBSDKGraphRequestErrorHTTPStatusCodeKey";
NSErrorUserInfoKey const FBSDKGraphRequestErrorParsedJSONResponseKey = @"com.facebook.sdk:FBSDKGraphRequestErrorParsedJSONResponseKey";

#else

NSString *const FBSDKErrorArgumentCollectionKey = @"com.facebook.sdk:FBSDKErrorArgumentCollectionKey";
NSString *const FBSDKErrorArgumentNameKey = @"com.facebook.sdk:FBSDKErrorArgumentNameKey";
NSString *const FBSDKErrorArgumentValueKey = @"com.facebook.sdk:FBSDKErrorArgumentValueKey";
NSString *const FBSDKErrorDeveloperMessageKey = @"com.facebook.sdk:FBSDKErrorDeveloperMessageKey";
NSString *const FBSDKErrorLocalizedDescriptionKey = @"com.facebook.sdk:FBSDKErrorLocalizedDescriptionKey";
NSString *const FBSDKErrorLocalizedTitleKey = @"com.facebook.sdk:FBSDKErrorLocalizedErrorTitleKey";

NSString *const FBSDKGraphRequestErrorKey = @"com.facebook.sdk:FBSDKGraphRequestErrorCategoryKey";
NSString *const FBSDKGraphRequestErrorCategoryKey = @"com.facebook.sdk:FBSDKGraphRequestErrorCategoryKey";
NSString *const FBSDKGraphRequestErrorGraphErrorCodeKey = @"com.facebook.sdk:FBSDKGraphRequestErrorGraphErrorCodeKey";
NSString *const FBSDKGraphRequestErrorGraphErrorSubcodeKey = @"com.facebook.sdk:FBSDKGraphRequestErrorGraphErrorSubcodeKey";
NSString *const FBSDKGraphRequestErrorHTTPStatusCodeKey = @"com.facebook.sdk:FBSDKGraphRequestErrorHTTPStatusCodeKey";
NSString *const FBSDKGraphRequestErrorParsedJSONResponseKey = @"com.facebook.sdk:FBSDKGraphRequestErrorParsedJSONResponseKey";

#endif
