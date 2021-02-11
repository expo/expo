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

#import "TargetConditionals.h"

#if !TARGET_OS_TV

 #import "FBSDKAppLinkResolver.h"

 #import <UIKit/UIKit.h>

 #import "FBSDKAccessToken.h"
 #import "FBSDKAppLink.h"
 #import "FBSDKAppLinkResolverRequestBuilder.h"
 #import "FBSDKAppLinkTarget.h"
 #import "FBSDKGraphRequest+Internal.h"
 #import "FBSDKGraphRequestConnection.h"
 #import "FBSDKInternalUtility.h"
 #import "FBSDKLogger.h"
 #import "FBSDKSettings+Internal.h"
 #import "FBSDKUtility.h"

static NSString *const kURLKey = @"url";
static NSString *const kIOSAppStoreIdKey = @"app_store_id";
static NSString *const kIOSAppNameKey = @"app_name";
static NSString *const kWebKey = @"web";
static NSString *const kIOSKey = @"ios";
static NSString *const kIPhoneKey = @"iphone";
static NSString *const kIPadKey = @"ipad";
static NSString *const kShouldFallbackKey = @"should_fallback";
static NSString *const kAppLinksKey = @"app_links";

@interface FBSDKAppLinkResolver ()

@property (nonatomic, strong) NSMutableDictionary<NSURL *, FBSDKAppLink *> *cachedFBSDKAppLinks;
@property (nonatomic, assign) UIUserInterfaceIdiom userInterfaceIdiom;
@property (nonatomic, strong) FBSDKAppLinkResolverRequestBuilder *requestBuilder;
@end

@implementation FBSDKAppLinkResolver

+ (void)initialize
{
  if (self == [FBSDKAppLinkResolver class]) {}
}

- (instancetype)initWithUserInterfaceIdiom:(UIUserInterfaceIdiom)userInterfaceIdiom
{
  if (self = [super init]) {
    self.cachedFBSDKAppLinks = [NSMutableDictionary dictionary];
    self.userInterfaceIdiom = userInterfaceIdiom;
    self.requestBuilder = [FBSDKAppLinkResolverRequestBuilder new];
  }
  return self;
}

- (instancetype)initWithUserInterfaceIdiom:(UIUserInterfaceIdiom)userInterfaceIdiom andRequestBuilder:(FBSDKAppLinkResolverRequestBuilder *)builder
{
  if (self = [super init]) {
    self.cachedFBSDKAppLinks = [NSMutableDictionary dictionary];
    self.userInterfaceIdiom = userInterfaceIdiom;
    self.requestBuilder = builder;
  }
  return self;
}

- (instancetype)initWithRequestBuilder:(FBSDKAppLinkResolverRequestBuilder *)builder
{
  if (self = [super init]) {
    self.cachedFBSDKAppLinks = [NSMutableDictionary dictionary];
    self.userInterfaceIdiom = UIDevice.currentDevice.userInterfaceIdiom;
    self.requestBuilder = builder;
  }
  return self;
}

- (void)appLinkFromURL:(NSURL *)url handler:(FBSDKAppLinkBlock)handler
{
  [self appLinksFromURLs:@[url] handler:^(NSDictionary<NSURL *, FBSDKAppLink *> *urls, NSError *_Nullable error) {
    handler(urls[url], error);
  }];
}

- (void)appLinksFromURLs:(NSArray<NSURL *> *)urls handler:(FBSDKAppLinksBlock)handler
{
  if (![FBSDKSettings clientToken] && ![FBSDKAccessToken currentAccessToken]) {
    [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorDeveloperErrors
                           logEntry:@"A user access token or clientToken is required to use FBAppLinkResolver"];
  }

  NSMutableDictionary<NSURL *, FBSDKAppLink *> *appLinks = [NSMutableDictionary dictionary];
  NSMutableArray<NSURL *> *toFind = [NSMutableArray array];

  @synchronized(self.cachedFBSDKAppLinks) {
    for (NSURL *url in urls) {
      if (self.cachedFBSDKAppLinks[url]) {
        [FBSDKTypeUtility dictionary:appLinks setObject:self.cachedFBSDKAppLinks[url] forKey:url];
      } else {
        [FBSDKTypeUtility array:toFind addObject:url];
      }
    }
  }
  if (toFind.count == 0) {
    // All of the URLs have already been found.
    handler(appLinks, nil);
    return;
  }

  FBSDKGraphRequest *request = [self.requestBuilder requestForURLs:urls];

  [request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection, id result, NSError *error) {
    if (error) {
      handler(@{}, error);
      return;
    }

    for (NSURL *url in toFind) {
      FBSDKAppLink *link = [self buildAppLinkForURL:url inResults:result];

      @synchronized(self.cachedFBSDKAppLinks) {
        [FBSDKTypeUtility dictionary:self.cachedFBSDKAppLinks setObject:link forKey:url];
      }

      [FBSDKTypeUtility dictionary:appLinks setObject:link forKey:url];
    }
    handler(appLinks, nil);
  }];
}

- (FBSDKAppLink *)buildAppLinkForURL:(NSURL *)url inResults:(id)result
{
  NSString *idiomSpecificField = [self.requestBuilder getIdiomSpecificField];

  id nestedObject = result[url.absoluteString][kAppLinksKey];
  NSMutableArray *rawTargets = [NSMutableArray array];
  if (idiomSpecificField) {
    [rawTargets addObjectsFromArray:nestedObject[idiomSpecificField]];
  }
  [rawTargets addObjectsFromArray:nestedObject[kIOSKey]];

  NSMutableArray<FBSDKAppLinkTarget *> *targets = [NSMutableArray arrayWithCapacity:rawTargets.count];
  for (id rawTarget in rawTargets) {
    [FBSDKTypeUtility array:targets addObject:[FBSDKAppLinkTarget appLinkTargetWithURL:[NSURL URLWithString:rawTarget[kURLKey]]
                                                                            appStoreId:rawTarget[kIOSAppStoreIdKey]
                                                                               appName:rawTarget[kIOSAppNameKey]]];
  }

  id webTarget = nestedObject[kWebKey];
  NSString *webFallbackString = webTarget[kURLKey];
  NSURL *fallbackUrl = webFallbackString ? [NSURL URLWithString:webFallbackString] : url;

  NSNumber *shouldFallback = webTarget[kShouldFallbackKey];
  if (shouldFallback != nil && !shouldFallback.boolValue) {
    fallbackUrl = nil;
  }

  return [FBSDKAppLink appLinkWithSourceURL:url
                                    targets:targets
                                     webURL:fallbackUrl];
}

 #pragma clang diagnostic push
 #pragma clang diagnostic ignored "-Wdeprecated-declarations"
+ (instancetype)resolver
{
  return [[self alloc] initWithUserInterfaceIdiom:UIDevice.currentDevice.userInterfaceIdiom];
}

 #pragma clang diagnostic pop

@end

#endif
