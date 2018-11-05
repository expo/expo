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

#import <FBSDKCoreKit/FBSDKMacros.h>

/**
  The error domain for all errors from FBSDKLoginKit

 Error codes from the SDK in the range 300-399 are reserved for this domain.
 */
FBSDK_EXTERN NSString *const FBSDKLoginErrorDomain;

/**
 NS_ENUM(NSInteger, FBSDKLoginErrorCode)
  Error codes for FBSDKLoginErrorDomain.
 */
typedef NS_ENUM(NSInteger, FBSDKLoginErrorCode)
{
  /**
    Reserved.
   */
  FBSDKLoginReservedErrorCode = 300,
  /**
    The error code for unknown errors.
   */
  FBSDKLoginUnknownErrorCode,

  /**
    The user's password has changed and must log in again
  */
  FBSDKLoginPasswordChangedErrorCode,
  /**
    The user must log in to their account on www.facebook.com to restore access
  */
  FBSDKLoginUserCheckpointedErrorCode,
  /**
    Indicates a failure to request new permissions because the user has changed.
   */
  FBSDKLoginUserMismatchErrorCode,
  /**
    The user must confirm their account with Facebook before logging in
  */
  FBSDKLoginUnconfirmedUserErrorCode,

  /**
    The Accounts framework failed without returning an error, indicating the
   app's slider in the iOS Facebook Settings (device Settings -> Facebook -> App Name) has
   been disabled.
   */
  FBSDKLoginSystemAccountAppDisabledErrorCode,
  /**
    An error occurred related to Facebook system Account store
  */
  FBSDKLoginSystemAccountUnavailableErrorCode,
  /**
    The login response was missing a valid challenge string.
  */
  FBSDKLoginBadChallengeString,
};

/**
 NS_ENUM(NSInteger, FBSDKDeviceLoginErrorCode)
 Error codes for FBSDKDeviceLoginErrorDomain.
 */
typedef NS_ENUM(NSUInteger, FBSDKDeviceLoginErrorSubcode) {
  /**
   Your device is polling too frequently.
   */
  FBSDKDeviceLoginExcessivePollingErrorSubcode = 1349172,
  /**
   User has declined to authorize your application.
   */
  FBSDKDeviceLoginAuthorizationDeclinedErrorSubcode = 1349173,
  /**
   User has not yet authorized your application. Continue polling.
   */
  FBSDKDeviceLoginAuthorizationPendingErrorSubcode = 1349174,
  /**
   The code you entered has expired.
   */
  FBSDKDeviceLoginCodeExpiredErrorSubcode = 1349152
};
