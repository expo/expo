/*
 *  Copyright (c) 2014, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

#import <Bolts/BFAppLink.h>

FOUNDATION_EXPORT NSString *const BFAppLinkDataParameterName;
FOUNDATION_EXPORT NSString *const BFAppLinkTargetKeyName;
FOUNDATION_EXPORT NSString *const BFAppLinkUserAgentKeyName;
FOUNDATION_EXPORT NSString *const BFAppLinkExtrasKeyName;
FOUNDATION_EXPORT NSString *const BFAppLinkVersionKeyName;
FOUNDATION_EXPORT NSString *const BFAppLinkRefererAppLink;
FOUNDATION_EXPORT NSString *const BFAppLinkRefererAppName;
FOUNDATION_EXPORT NSString *const BFAppLinkRefererUrl;

@interface BFAppLink (Internal)

+ (instancetype)appLinkWithSourceURL:(NSURL *)sourceURL
                             targets:(NSArray *)targets
                              webURL:(NSURL *)webURL
                    isBackToReferrer:(BOOL)isBackToReferrer;

/*! return if this AppLink is to go back to referrer. */
@property (nonatomic, assign, readonly, getter=isBackToReferrer) BOOL backToReferrer;

@end
