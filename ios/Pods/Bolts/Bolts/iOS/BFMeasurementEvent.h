/*
 *  Copyright (c) 2014, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

#import <Foundation/Foundation.h>

/*! The name of the notification posted by BFMeasurementEvent */
FOUNDATION_EXPORT NSString *const BFMeasurementEventNotificationName;

/*! Defines keys in the userInfo object for the notification named BFMeasurementEventNotificationName */
/*! The string field for the name of the event */
FOUNDATION_EXPORT NSString *const BFMeasurementEventNameKey;
/*! The dictionary field for the arguments of the event */
FOUNDATION_EXPORT NSString *const BFMeasurementEventArgsKey;

/*! Bolts Events raised by BFMeasurementEvent for Applink */
/*!
 The name of the event posted when [BFURL URLWithURL:] is called successfully. This represents the successful parsing of an app link URL.
 */
FOUNDATION_EXPORT NSString *const BFAppLinkParseEventName;

/*!
 The name of the event posted when [BFURL URLWithInboundURL:] is called successfully.
 This represents parsing an inbound app link URL from a different application
 */
FOUNDATION_EXPORT NSString *const BFAppLinkNavigateInEventName;

/*! The event raised when the user navigates from your app to other apps */
FOUNDATION_EXPORT NSString *const BFAppLinkNavigateOutEventName;

/*!
 The event raised when the user navigates out from your app and back to the referrer app.
 e.g when the user leaves your app after tapping the back-to-referrer navigation bar
 */
FOUNDATION_EXPORT NSString *const BFAppLinkNavigateBackToReferrerEventName;

@interface BFMeasurementEvent : NSObject

@end
