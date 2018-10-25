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

/*! The name of the notification posted by FBSDKMeasurementEvent */
FOUNDATION_EXPORT NSNotificationName const FBSDKMeasurementEventNotification;

#else

/*! The name of the notification posted by FBSDKMeasurementEvent */
FOUNDATION_EXPORT NSString *const FBSDKMeasurementEventNotification;

#endif

FOUNDATION_EXPORT NSString *const FBSDKMeasurementEventNotificationName
DEPRECATED_MSG_ATTRIBUTE("Use `FBSDKMeasurementEventNotification` instead");

/*! Defines keys in the userInfo object for the notification named FBSDKMeasurementEventNotificationName */
/*! The string field for the name of the event */
FOUNDATION_EXPORT NSString *const FBSDKMeasurementEventNameKey;
/*! The dictionary field for the arguments of the event */
FOUNDATION_EXPORT NSString *const FBSDKMeasurementEventArgsKey;

/*! Events raised by FBSDKMeasurementEvent for Applink */
/*!
 The name of the event posted when [FBSDKURL URLWithURL:] is called successfully. This represents the successful parsing of an app link URL.
 */
FOUNDATION_EXPORT NSString *const FBSDKAppLinkParseEventName;

/*!
 The name of the event posted when [FBSDKURL URLWithInboundURL:] is called successfully.
 This represents parsing an inbound app link URL from a different application
 */
FOUNDATION_EXPORT NSString *const FBSDKAppLinkNavigateInEventName;

/*! The event raised when the user navigates from your app to other apps */
FOUNDATION_EXPORT NSString *const FBSDKAppLinkNavigateOutEventName;

/*!
 The event raised when the user navigates out from your app and back to the referrer app.
 e.g when the user leaves your app after tapping the back-to-referrer navigation bar
 */
FOUNDATION_EXPORT NSString *const FBSDKAppLinkNavigateBackToReferrerEventName;

@interface FBSDKMeasurementEvent : NSObject

@end

NS_ASSUME_NONNULL_END
