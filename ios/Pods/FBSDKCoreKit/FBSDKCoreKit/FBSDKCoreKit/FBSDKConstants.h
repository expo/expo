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

NS_ASSUME_NONNULL_BEGIN

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_10_0

/**
 The error domain for all errors from FBSDKCoreKit.

 Error codes from the SDK in the range 0-99 are reserved for this domain.
 */
FOUNDATION_EXPORT NSErrorDomain const FBSDKErrorDomain
NS_SWIFT_NAME(ErrorDomain);

#else

/**
 The error domain for all errors from FBSDKCoreKit.

 Error codes from the SDK in the range 0-99 are reserved for this domain.
 */
FOUNDATION_EXPORT NSString *const FBSDKErrorDomain
NS_SWIFT_NAME(ErrorDomain);

#endif

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_11_0

/*
 @methodgroup error userInfo keys
 */

/**
 The userInfo key for the invalid collection for errors with FBSDKErrorInvalidArgument.

 If the invalid argument is a collection, the collection can be found with this key and the individual
 invalid item can be found with FBSDKErrorArgumentValueKey.
 */
FOUNDATION_EXPORT NSErrorUserInfoKey const FBSDKErrorArgumentCollectionKey
NS_SWIFT_NAME(ErrorArgumentCollectionKey);

/**
 The userInfo key for the invalid argument name for errors with FBSDKErrorInvalidArgument.
 */
FOUNDATION_EXPORT NSErrorUserInfoKey const FBSDKErrorArgumentNameKey
NS_SWIFT_NAME(ErrorArgumentNameKey);

/**
 The userInfo key for the invalid argument value for errors with FBSDKErrorInvalidArgument.
 */
FOUNDATION_EXPORT NSErrorUserInfoKey const FBSDKErrorArgumentValueKey
NS_SWIFT_NAME(ErrorArgumentValueKey);

/**
 The userInfo key for the message for developers in NSErrors that originate from the SDK.

 The developer message will not be localized and is not intended to be presented within the app.
 */
FOUNDATION_EXPORT NSErrorUserInfoKey const FBSDKErrorDeveloperMessageKey
NS_SWIFT_NAME(ErrorDeveloperMessageKey);

/**
 The userInfo key describing a localized description that can be presented to the user.
 */
FOUNDATION_EXPORT NSErrorUserInfoKey const FBSDKErrorLocalizedDescriptionKey
NS_SWIFT_NAME(ErrorLocalizedDescriptionKey);

/**
 The userInfo key describing a localized title that can be presented to the user, used with `FBSDKLocalizedErrorDescriptionKey`.
 */
FOUNDATION_EXPORT NSErrorUserInfoKey const FBSDKErrorLocalizedTitleKey
NS_SWIFT_NAME(ErrorLocalizedTitleKey);

/*
 @methodgroup FBSDKGraphRequest error userInfo keys
 */

/**
 The userInfo key describing the error category, for error recovery purposes.

 See `FBSDKGraphErrorRecoveryProcessor` and `[FBSDKGraphRequest disableErrorRecovery]`.
 */
FOUNDATION_EXPORT NSErrorUserInfoKey const FBSDKGraphRequestErrorKey
NS_SWIFT_NAME(GraphRequestErrorKey);

/*
 The userInfo key for the Graph API error code.
 */
FOUNDATION_EXPORT NSErrorUserInfoKey const FBSDKGraphRequestErrorGraphErrorCodeKey
NS_SWIFT_NAME(GraphRequestErrorGraphErrorCodeKey);

/*
 The userInfo key for the Graph API error subcode.
 */
FOUNDATION_EXPORT NSErrorUserInfoKey const FBSDKGraphRequestErrorGraphErrorSubcodeKey
NS_SWIFT_NAME(GraphRequestErrorGraphErrorSubcodeKey);

/*
 The userInfo key for the HTTP status code.
 */
FOUNDATION_EXPORT NSErrorUserInfoKey const FBSDKGraphRequestErrorHTTPStatusCodeKey
NS_SWIFT_NAME(GraphRequestErrorHTTPStatusCodeKey);

/*
 The userInfo key for the raw JSON response.
 */
FOUNDATION_EXPORT NSErrorUserInfoKey const FBSDKGraphRequestErrorParsedJSONResponseKey
NS_SWIFT_NAME(GraphRequestErrorParsedJSONResponseKey);

#else

/*
 @methodgroup error userInfo keys
 */

/**
 The userInfo key for the invalid collection for errors with FBSDKErrorInvalidArgument.

 If the invalid argument is a collection, the collection can be found with this key and the individual
 invalid item can be found with FBSDKErrorArgumentValueKey.
 */
FOUNDATION_EXPORT NSString *const FBSDKErrorArgumentCollectionKey
NS_SWIFT_NAME(ErrorArgumentCollectionKey);

/**
 The userInfo key for the invalid argument name for errors with FBSDKErrorInvalidArgument.
 */
FOUNDATION_EXPORT NSString *const FBSDKErrorArgumentNameKey
NS_SWIFT_NAME(ErrorArgumentNameKey);

/**
 The userInfo key for the invalid argument value for errors with FBSDKErrorInvalidArgument.
 */
FOUNDATION_EXPORT NSString *const FBSDKErrorArgumentValueKey
NS_SWIFT_NAME(ErrorArgumentValueKey);

/**
 The userInfo key for the message for developers in NSErrors that originate from the SDK.

 The developer message will not be localized and is not intended to be presented within the app.
 */
FOUNDATION_EXPORT NSString *const FBSDKErrorDeveloperMessageKey
NS_SWIFT_NAME(ErrorDeveloperMessageKey);

/**
 The userInfo key describing a localized description that can be presented to the user.
 */
FOUNDATION_EXPORT NSString *const FBSDKErrorLocalizedDescriptionKey
NS_SWIFT_NAME(ErrorLocalizedDescriptionKey);

/**
 The userInfo key describing a localized title that can be presented to the user, used with `FBSDKLocalizedErrorDescriptionKey`.
 */
FOUNDATION_EXPORT NSString *const FBSDKErrorLocalizedTitleKey
NS_SWIFT_NAME(ErrorLocalizedTitleKey);

/*
 @methodgroup FBSDKGraphRequest error userInfo keys
 */

/**
 The userInfo key describing the error category, for error recovery purposes.

 See `FBSDKGraphErrorRecoveryProcessor` and `[FBSDKGraphRequest disableErrorRecovery]`.
 */
FOUNDATION_EXPORT NSString *const FBSDKGraphRequestErrorKey
NS_SWIFT_NAME(GraphRequestErrorKey);

/*
 The userInfo key for the Graph API error code.
 */
FOUNDATION_EXPORT NSString *const FBSDKGraphRequestErrorGraphErrorCodeKey
NS_SWIFT_NAME(GraphRequestErrorGraphErrorCodeKey);

/*
 The userInfo key for the Graph API error subcode.
 */
FOUNDATION_EXPORT NSString *const FBSDKGraphRequestErrorGraphErrorSubcodeKey
NS_SWIFT_NAME(GraphRequestErrorGraphErrorSubcodeKey);

/*
 The userInfo key for the HTTP status code.
 */
FOUNDATION_EXPORT NSString *const FBSDKGraphRequestErrorHTTPStatusCodeKey
NS_SWIFT_NAME(GraphRequestErrorHTTPStatusCodeKey);

/*
 The userInfo key for the raw JSON response.
 */
FOUNDATION_EXPORT NSString *const FBSDKGraphRequestErrorParsedJSONResponseKey
NS_SWIFT_NAME(GraphRequestErrorParsedJSONResponseKey);

#endif

/*
 @methodgroup Common Code Block typedefs
 */

/**
 Success Block
 */
typedef void (^FBSDKCodeBlock)(void)
NS_SWIFT_NAME(CodeBlock);

/**
 Error Block
 */
typedef void (^FBSDKErrorBlock)(NSError *_Nullable error)
NS_SWIFT_NAME(ErrorBlock);

/**
 Success Block
 */
typedef void (^FBSDKSuccessBlock)(BOOL success, NSError *_Nullable error)
NS_SWIFT_NAME(SuccessBlock);

/*
 @methodgroup Enums
 */

#ifndef NS_ERROR_ENUM
#define NS_ERROR_ENUM(_domain, _name) \
enum _name: NSInteger _name; \
enum __attribute__((ns_error_domain(_domain))) _name: NSInteger
#endif

/**
 FBSDKCoreError
 Error codes for FBSDKErrorDomain.
 */
typedef NS_ERROR_ENUM(FBSDKErrorDomain, FBSDKCoreError)
{
  /**
   Reserved.
   */
  FBSDKErrorReserved = 0,

  /**
   The error code for errors from invalid encryption on incoming encryption URLs.
   */
  FBSDKErrorEncryption,

  /**
   The error code for errors from invalid arguments to SDK methods.
   */
  FBSDKErrorInvalidArgument,

  /**
   The error code for unknown errors.
   */
  FBSDKErrorUnknown,

  /**
   A request failed due to a network error. Use NSUnderlyingErrorKey to retrieve
   the error object from the NSURLSession for more information.
   */
  FBSDKErrorNetwork,

  /**
   The error code for errors encountered during an App Events flush.
   */
  FBSDKErrorAppEventsFlush,

  /**
   An endpoint that returns a binary response was used with FBSDKGraphRequestConnection.

   Endpoints that return image/jpg, etc. should be accessed using NSURLRequest
   */
  FBSDKErrorGraphRequestNonTextMimeTypeReturned,

  /**
   The operation failed because the server returned an unexpected response.

   You can get this error if you are not using the most recent SDK, or you are accessing a version of the
   Graph API incompatible with the current SDK.
   */
  FBSDKErrorGraphRequestProtocolMismatch,

  /**
   The Graph API returned an error.

   See below for useful userInfo keys (beginning with FBSDKGraphRequestError*)
   */
  FBSDKErrorGraphRequestGraphAPI,

  /**
   The specified dialog configuration is not available.

   This error may signify that the configuration for the dialogs has not yet been downloaded from the server
   or that the dialog is unavailable.  Subsequent attempts to use the dialog may succeed as the configuration is loaded.
   */
  FBSDKErrorDialogUnavailable,

  /**
   Indicates an operation failed because a required access token was not found.
   */
  FBSDKErrorAccessTokenRequired,

  /**
   Indicates an app switch (typically for a dialog) failed because the destination app is out of date.
   */
  FBSDKErrorAppVersionUnsupported,

  /**
   Indicates an app switch to the browser (typically for a dialog) failed.
   */
  FBSDKErrorBrowserUnavailable,
} NS_SWIFT_NAME(CoreError);

/**
 FBSDKGraphRequestError
 Describes the category of Facebook error. See `FBSDKGraphRequestErrorKey`.
 */
typedef NS_ENUM(NSUInteger, FBSDKGraphRequestError)
{
  /** The default error category that is not known to be recoverable. Check `FBSDKLocalizedErrorDescriptionKey` for a user facing message. */
  FBSDKGraphRequestErrorOther = 0,
  /** Indicates the error is temporary (such as server throttling). While a recoveryAttempter will be provided with the error instance, the attempt is guaranteed to succeed so you can simply retry the operation if you do not want to present an alert.  */
  FBSDKGraphRequestErrorTransient = 1,
  /** Indicates the error can be recovered (such as requiring a login). A recoveryAttempter will be provided with the error instance that can take UI action. */
  FBSDKGraphRequestErrorRecoverable = 2
} NS_SWIFT_NAME(GraphRequestError);

/**
 a formal protocol very similar to the informal protocol NSErrorRecoveryAttempting
 */
NS_SWIFT_UNAVAILABLE("")
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
- (void)attemptRecoveryFromError:(NSError *)error
                     optionIndex:(NSUInteger)recoveryOptionIndex
                        delegate:(nullable id)delegate
              didRecoverSelector:(SEL)didRecoverSelector
                     contextInfo:(nullable void *)contextInfo;
@end

NS_ASSUME_NONNULL_END
