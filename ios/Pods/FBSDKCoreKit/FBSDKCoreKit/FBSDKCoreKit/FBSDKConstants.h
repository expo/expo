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
  The error domain for all errors from FBSDKCoreKit.

 Error codes from the SDK in the range 0-99 are reserved for this domain.
 */
FBSDK_EXTERN NSString *const FBSDKErrorDomain;

/**
 NS_ENUM(NSInteger, FBSDKErrorCode)
  Error codes for FBSDKErrorDomain.
 */
typedef NS_ENUM(NSInteger, FBSDKErrorCode)
{
  /**
    Reserved.
   */
  FBSDKReservedErrorCode = 0,

  /**
    The error code for errors from invalid encryption on incoming encryption URLs.
   */
  FBSDKEncryptionErrorCode,

  /**
    The error code for errors from invalid arguments to SDK methods.
   */
  FBSDKInvalidArgumentErrorCode,

  /**
    The error code for unknown errors.
   */
  FBSDKUnknownErrorCode,

  /**
    A request failed due to a network error. Use NSUnderlyingErrorKey to retrieve
   the error object from the NSURLConnection for more information.
   */
  FBSDKNetworkErrorCode,

  /**
    The error code for errors encountered during an App Events flush.
   */
  FBSDKAppEventsFlushErrorCode,

  /**
    An endpoint that returns a binary response was used with FBSDKGraphRequestConnection.

 Endpoints that return image/jpg, etc. should be accessed using NSURLRequest
   */
  FBSDKGraphRequestNonTextMimeTypeReturnedErrorCode,

  /**
    The operation failed because the server returned an unexpected response.

 You can get this error if you are not using the most recent SDK, or you are accessing a version of the
   Graph API incompatible with the current SDK.
   */
  FBSDKGraphRequestProtocolMismatchErrorCode,

  /**
    The Graph API returned an error.

 See below for useful userInfo keys (beginning with FBSDKGraphRequestError*)
   */
  FBSDKGraphRequestGraphAPIErrorCode,

  /**
    The specified dialog configuration is not available.

 This error may signify that the configuration for the dialogs has not yet been downloaded from the server
   or that the dialog is unavailable.  Subsequent attempts to use the dialog may succeed as the configuration is loaded.
   */
  FBSDKDialogUnavailableErrorCode,

  /**
    Indicates an operation failed because a required access token was not found.
   */
  FBSDKAccessTokenRequiredErrorCode,

  /**
    Indicates an app switch (typically for a dialog) failed because the destination app is out of date.
   */
  FBSDKAppVersionUnsupportedErrorCode,

  /**
    Indicates an app switch to the browser (typically for a dialog) failed.
   */
  FBSDKBrowserUnavailableErrorCode,

  /**

@warning use FBSDKBrowserUnavailableErrorCode instead
   */
  FBSDKBrowswerUnavailableErrorCode __attribute__ ((deprecated("use FBSDKBrowserUnavailableErrorCode instead"))) = FBSDKBrowserUnavailableErrorCode,
};

/**
 NS_ENUM(NSUInteger, FBSDKGraphRequestErrorCategory)
  Describes the category of Facebook error. See `FBSDKGraphRequestErrorCategoryKey`.
 */
typedef NS_ENUM(NSUInteger, FBSDKGraphRequestErrorCategory)
{
  /** The default error category that is not known to be recoverable. Check `FBSDKLocalizedErrorDescriptionKey` for a user facing message. */
  FBSDKGraphRequestErrorCategoryOther = 0,
  /** Indicates the error is temporary (such as server throttling). While a recoveryAttempter will be provided with the error instance, the attempt is guaranteed to succeed so you can simply retry the operation if you do not want to present an alert.  */
  FBSDKGraphRequestErrorCategoryTransient = 1,
  /** Indicates the error can be recovered (such as requiring a login). A recoveryAttempter will be provided with the error instance that can take UI action. */
  FBSDKGraphRequestErrorCategoryRecoverable = 2
};

/*
 @methodgroup error userInfo keys
 */

/**
  The userInfo key for the invalid collection for errors with FBSDKInvalidArgumentErrorCode.

 If the invalid argument is a collection, the collection can be found with this key and the individual
 invalid item can be found with FBSDKErrorArgumentValueKey.
 */
FBSDK_EXTERN NSString *const FBSDKErrorArgumentCollectionKey;

/**
  The userInfo key for the invalid argument name for errors with FBSDKInvalidArgumentErrorCode.
 */
FBSDK_EXTERN NSString *const FBSDKErrorArgumentNameKey;

/**
 The userInfo key for the invalid argument value for errors with FBSDKInvalidArgumentErrorCode.
 */
FBSDK_EXTERN NSString *const FBSDKErrorArgumentValueKey;

/**
  The userInfo key for the message for developers in NSErrors that originate from the SDK.

 The developer message will not be localized and is not intended to be presented within the app.
 */
FBSDK_EXTERN NSString *const FBSDKErrorDeveloperMessageKey;

/**
  The userInfo key describing a localized description that can be presented to the user.
 */
FBSDK_EXTERN NSString *const FBSDKErrorLocalizedDescriptionKey;

/**
  The userInfo key describing a localized title that can be presented to the user, used with `FBSDKLocalizedErrorDescriptionKey`.
 */
FBSDK_EXTERN NSString *const FBSDKErrorLocalizedTitleKey;

/*
 @methodgroup FBSDKGraphRequest error userInfo keys
 */

/**
  The userInfo key describing the error category, for error recovery purposes.

 See `FBSDKGraphErrorRecoveryProcessor` and `[FBSDKGraphRequest disableErrorRecovery]`.
 */
FBSDK_EXTERN NSString *const FBSDKGraphRequestErrorCategoryKey;

/*
  The userInfo key for the Graph API error code.
 */
FBSDK_EXTERN NSString *const FBSDKGraphRequestErrorGraphErrorCode;

/*
  The userInfo key for the Graph API error subcode.
 */
FBSDK_EXTERN NSString *const FBSDKGraphRequestErrorGraphErrorSubcode;

/*
  The userInfo key for the HTTP status code.
 */
FBSDK_EXTERN NSString *const FBSDKGraphRequestErrorHTTPStatusCodeKey;

/*
  The userInfo key for the raw JSON response.
 */
FBSDK_EXTERN NSString *const FBSDKGraphRequestErrorParsedJSONResponseKey;

/**
  a formal protocol very similar to the informal protocol NSErrorRecoveryAttempting
 */
@protocol FBSDKErrorRecoveryAttempting<NSObject>

/**
  attempt the recovery
 @param error the error
 @param recoveryOptionIndex the selected option index
 @param delegate the delegate
 @param didRecoverSelector the callback selector, see discussion.
 @param contextInfo context info to pass back to callback selector, see discussion.


 Given that an error alert has been presented document-modally to the user, and the user has chosen one of the error's recovery options, attempt recovery from the error, and send the selected message to the specified delegate. The option index is an index into the error's array of localized recovery options. The method selected by didRecoverSelector must have the same signature as:

 - (void)didPresentErrorWithRecovery:(BOOL)didRecover contextInfo:(void *)contextInfo;

 The value passed for didRecover must be YES if error recovery was completely successful, NO otherwise.
 */
- (void)attemptRecoveryFromError:(NSError *)error optionIndex:(NSUInteger)recoveryOptionIndex delegate:(id)delegate didRecoverSelector:(SEL)didRecoverSelector contextInfo:(void *)contextInfo;

@end
