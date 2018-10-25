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
  The error domain for all errors from FBSDKShareKit.

 Error codes from the SDK in the range 200-299 are reserved for this domain.
 */
FBSDK_EXTERN NSString *const FBSDKShareErrorDomain;

/**
 NS_ENUM(NSInteger, FBSDKShareErrorCode)
  Error codes for FBSDKShareErrorDomain.
 */
typedef NS_ENUM(NSInteger, FBSDKShareErrorCode)
{
  /**
    Reserved.
   */
  FBSDKShareReservedErrorCode = 200,

  /**
    The error code for errors from uploading open graph objects.
   */
  FBSDKShareOpenGraphErrorCode,

  /**
    The error code for when a sharing dialog is not available.

 Use the canShare methods to check for this case before calling show.
   */
  FBSDKShareDialogNotAvailableErrorCode,

  /**
   @The error code for unknown errors.
   */
  FBSDKShareUnknownErrorCode,
};
