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

@class BFTask;

/*!
 Implement this protocol to provide an alternate strategy for resolving
 App Links that may include pre-fetching, caching, or querying for App Link
 data from an index provided by a service provider.
 */
@protocol BFAppLinkResolving <NSObject>

/*!
 Asynchronously resolves App Link data for a given URL.

 @param url The URL to resolve into an App Link.
 @returns A BFTask that will return a BFAppLink for the given URL.
 */
- (BFTask *)appLinkFromURLInBackground:(NSURL *)url NS_EXTENSION_UNAVAILABLE_IOS("Not available in app extension");

@end
