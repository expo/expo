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

#import <Bolts/BFAppLinkResolving.h>

/*!
 A reference implementation for an App Link resolver that uses a hidden UIWebView
 to parse the HTML containing App Link metadata.
 */
@interface BFWebViewAppLinkResolver : NSObject <BFAppLinkResolving>

/*!
 Gets the instance of a BFWebViewAppLinkResolver.
 */
+ (instancetype)sharedInstance;

@end
