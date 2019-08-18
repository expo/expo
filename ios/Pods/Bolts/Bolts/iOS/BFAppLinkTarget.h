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

/*!
 Represents a target defined in App Link metadata, consisting of at least
 a URL, and optionally an App Store ID and name.
 */
@interface BFAppLinkTarget : NSObject

/*! Creates a BFAppLinkTarget with the given app site and target URL. */
+ (instancetype)appLinkTargetWithURL:(NSURL *)url
                          appStoreId:(NSString *)appStoreId
                             appName:(NSString *)appName;

/*! The URL prefix for this app link target */
@property (nonatomic, strong, readonly) NSURL *URL;

/*! The app ID for the app store */
@property (nonatomic, copy, readonly) NSString *appStoreId;

/*! The name of the app */
@property (nonatomic, copy, readonly) NSString *appName;

@end
