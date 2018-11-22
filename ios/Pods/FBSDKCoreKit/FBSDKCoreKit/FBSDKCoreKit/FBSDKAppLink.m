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

#import "FBSDKAppLink_Internal.h"

NSString *const FBSDKAppLinkDataParameterName = @"al_applink_data";
NSString *const FBSDKAppLinkTargetKeyName = @"target_url";
NSString *const FBSDKAppLinkUserAgentKeyName = @"user_agent";
NSString *const FBSDKAppLinkExtrasKeyName = @"extras";
NSString *const FBSDKAppLinkRefererAppLink = @"referer_app_link";
NSString *const FBSDKAppLinkRefererAppName = @"app_name";
NSString *const FBSDKAppLinkRefererUrl = @"url";
NSString *const FBSDKAppLinkVersionKeyName = @"version";
NSString *const FBSDKAppLinkVersion = @"1.0";

@interface FBSDKAppLink ()

@property (nonatomic, strong, readwrite) NSURL *sourceURL;
@property (nonatomic, copy, readwrite) NSArray<FBSDKAppLinkTarget *> *targets;
@property (nonatomic, strong, readwrite) NSURL *webURL;

@property (nonatomic, assign, readwrite, getter=isBackToReferrer) BOOL backToReferrer;

@end

@implementation FBSDKAppLink

+ (instancetype)appLinkWithSourceURL:(NSURL *)sourceURL
                             targets:(NSArray<FBSDKAppLinkTarget *> *)targets
                              webURL:(NSURL *)webURL
                    isBackToReferrer:(BOOL)isBackToReferrer {
    FBSDKAppLink *link = [[self alloc] initWithIsBackToReferrer:isBackToReferrer];
    link.sourceURL = sourceURL;
    link.targets = [targets copy];
    link.webURL = webURL;
    return link;
}

+ (instancetype)appLinkWithSourceURL:(NSURL *)sourceURL
                             targets:(NSArray<FBSDKAppLinkTarget *> *)targets
                              webURL:(NSURL *)webURL {
    return [self appLinkWithSourceURL:sourceURL
                              targets:targets
                               webURL:webURL
                     isBackToReferrer:NO];
}

- (FBSDKAppLink *)initWithIsBackToReferrer:(BOOL)backToReferrer {
    if ((self = [super init])) {
        _backToReferrer = backToReferrer;
    }
    return self;
}

@end
