/*
 *  Copyright (c) 2014, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

#import "BFAppLink_Internal.h"

NSString *const BFAppLinkDataParameterName = @"al_applink_data";
NSString *const BFAppLinkTargetKeyName = @"target_url";
NSString *const BFAppLinkUserAgentKeyName = @"user_agent";
NSString *const BFAppLinkExtrasKeyName = @"extras";
NSString *const BFAppLinkRefererAppLink = @"referer_app_link";
NSString *const BFAppLinkRefererAppName = @"app_name";
NSString *const BFAppLinkRefererUrl = @"url";
NSString *const BFAppLinkVersionKeyName = @"version";
NSString *const BFAppLinkVersion = @"1.0";

@interface BFAppLink ()

@property (nonatomic, strong, readwrite) NSURL *sourceURL;
@property (nonatomic, copy, readwrite) NSArray *targets;
@property (nonatomic, strong, readwrite) NSURL *webURL;

@property (nonatomic, assign, readwrite, getter=isBackToReferrer) BOOL backToReferrer;

@end

@implementation BFAppLink

+ (instancetype)appLinkWithSourceURL:(NSURL *)sourceURL
                             targets:(NSArray *)targets
                              webURL:(NSURL *)webURL
                    isBackToReferrer:(BOOL)isBackToReferrer {
    BFAppLink *link = [[self alloc] initWithIsBackToReferrer:isBackToReferrer];
    link.sourceURL = sourceURL;
    link.targets = [targets copy];
    link.webURL = webURL;
    return link;
}

+ (instancetype)appLinkWithSourceURL:(NSURL *)sourceURL
                             targets:(NSArray *)targets
                              webURL:(NSURL *)webURL {
    return [self appLinkWithSourceURL:sourceURL
                              targets:targets
                               webURL:webURL
                     isBackToReferrer:NO];
}

- (BFAppLink *)initWithIsBackToReferrer:(BOOL)backToReferrer {
    if ((self = [super init])) {
        _backToReferrer = backToReferrer;
    }
    return self;
}

@end
