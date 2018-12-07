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

#import <Foundation/Foundation.h>

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_10_0

/**
 The error domain for all errors from FBSDKShareKit.

 Error codes from the SDK in the range 200-299 are reserved for this domain.
 */
FOUNDATION_EXPORT NSErrorDomain const FBSDKShareErrorDomain;

#else

/**
 The error domain for all errors from FBSDKShareKit.

 Error codes from the SDK in the range 200-299 are reserved for this domain.
 */
FOUNDATION_EXPORT NSString *const FBSDKShareErrorDomain;

#endif

#ifndef NS_ERROR_ENUM
#define NS_ERROR_ENUM(_domain, _name) \
enum _name: NSInteger _name; \
enum __attribute__((ns_error_domain(_domain))) _name: NSInteger
#endif

/**
 FBSDKShareError
 Error codes for FBSDKShareErrorDomain.
 */
typedef NS_ERROR_ENUM(FBSDKShareErrorDomain, FBSDKShareError)
{
  /**
   Reserved.
   */
  FBSDKShareErrorReserved = 200,

  /**
   The error code for errors from uploading open graph objects.
   */
  FBSDKShareErrorOpenGraph,

  /**
   The error code for when a sharing dialog is not available.

   Use the canShare methods to check for this case before calling show.
   */
  FBSDKShareErrorDialogNotAvailable,

  /**
   @The error code for unknown errors.
   */
  FBSDKShareErrorUnknown,
};

/**
 Deprecated
 */
typedef NS_ENUM(NSInteger, FBSDKShareErrorCode)
{
  FBSDKShareReservedErrorCode DEPRECATED_MSG_ATTRIBUTE("use FBSDKShareErrorReserved instead") = 200,
  FBSDKShareOpenGraphErrorCode DEPRECATED_MSG_ATTRIBUTE("use FBSDKShareErrorOpenGraph instead"),
  FBSDKShareDialogNotAvailableErrorCode DEPRECATED_MSG_ATTRIBUTE("use FBSDKShareErrorDialogNotAvailable instead"),
  FBSDKShareUnknownErrorCode DEPRECATED_MSG_ATTRIBUTE("use FBSDKShareErrorUnknown instead"),
} DEPRECATED_MSG_ATTRIBUTE("use FBSDKShareError instead");
