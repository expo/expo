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

#import "FBSDKAppLinkResolver.h"

#import <UIKit/UIKit.h>

#import <Bolts/BFAppLink.h>
#import <Bolts/BFAppLinkTarget.h>
#import <Bolts/BFTask.h>
#import <Bolts/BFTaskCompletionSource.h>

#import "FBSDKAccessToken.h"
#import "FBSDKAppLink.h"
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

@property (nonatomic, strong) NSMutableDictionary<NSURL *, BFAppLink *> *cachedBFAppLinks;
@property (nonatomic, strong) NSMutableDictionary<NSURL *, FBSDKAppLink *> *cachedFBSDKAppLinks;
@property (nonatomic, assign) UIUserInterfaceIdiom userInterfaceIdiom;
@end

@implementation FBSDKAppLinkResolver

static Class g_BFTaskCompletionSourceClass;
static Class g_BFAppLinkTargetClass;
static Class g_BFAppLinkClass;
static Class g_BFTaskClass;

+ (void)initialize
{
  if (self == [FBSDKAppLinkResolver class]) {
    g_BFTaskCompletionSourceClass = [FBSDKInternalUtility
                                     resolveBoltsClassWithName:@"BFTaskCompletionSource"];
    g_BFAppLinkTargetClass = [FBSDKInternalUtility resolveBoltsClassWithName:@"BFAppLinkTarget"];
    g_BFTaskClass = [FBSDKInternalUtility resolveBoltsClassWithName:@"BFTask"];
    g_BFAppLinkClass = [FBSDKInternalUtility resolveBoltsClassWithName:@"BFAppLink"];
  }
}

- (instancetype)initWithUserInterfaceIdiom:(UIUserInterfaceIdiom)userInterfaceIdiom
{
  if (self = [super init]) {
    self.cachedBFAppLinks = [NSMutableDictionary dictionary];
    self.cachedFBSDKAppLinks = [NSMutableDictionary dictionary];
    self.userInterfaceIdiom = userInterfaceIdiom;
  }
  return self;
}

- (void)appLinkFromURL:(NSURL *)url handler:(FBSDKAppLinkFromURLHandler)handler
{
  [self appLinksFromURLs:@[url] handler:^(NSDictionary<NSURL *, FBSDKAppLink *> *urls, NSError * _Nullable error) {
    handler(urls[url], error);
  }];
}

- (void)appLinksFromURLs:(NSArray<NSURL *> *)urls handler:(FBSDKAppLinksFromURLArrayHandler)handler
{
  if (![FBSDKSettings clientToken] && ![FBSDKAccessToken currentAccessToken]) {
    [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorDeveloperErrors
                           logEntry:@"A user access token or clientToken is required to use FBAppLinkResolver"];
  }
  NSMutableDictionary<NSURL *, FBSDKAppLink *> *appLinks = [NSMutableDictionary dictionary];
  NSMutableArray<NSURL *> *toFind = [NSMutableArray array];
  NSMutableArray<NSString *> *toFindStrings = [NSMutableArray array];

  @synchronized (self.cachedFBSDKAppLinks) {
    for (NSURL *url in urls) {
      if (self.cachedFBSDKAppLinks[url]) {
        appLinks[url] = self.cachedFBSDKAppLinks[url];
      } else {
        [toFind addObject:url];
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
        NSString *toFindString = [url.absoluteString stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding];
#pragma clang diagnostic pop
        if (toFindString) {
          [toFindStrings addObject:toFindString];
        }
      }
    }
  }
  if (toFind.count == 0) {
    // All of the URLs have already been found.
    handler(_cachedFBSDKAppLinks, nil);
  }
  NSMutableArray<NSString *> *fields = [NSMutableArray arrayWithObject:kIOSKey];

  NSString *idiomSpecificField = nil;

  switch (self.userInterfaceIdiom) {
    case UIUserInterfaceIdiomPad:
      idiomSpecificField = kIPadKey;
      break;
    case UIUserInterfaceIdiomPhone:
      idiomSpecificField = kIPhoneKey;
      break;
    default:
      break;
  }
  if (idiomSpecificField) {
    [fields addObject:idiomSpecificField];
  }
  NSString *path = [NSString stringWithFormat:@"?fields=%@.fields(%@)&ids=%@",
                    kAppLinksKey,
                    [fields componentsJoinedByString:@","],
                    [toFindStrings componentsJoinedByString:@","]];
  FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc] initWithGraphPath:path
                                                                 parameters:nil
                                                                      flags:FBSDKGraphRequestFlagDoNotInvalidateTokenOnError | FBSDKGraphRequestFlagDisableErrorRecovery];

  [request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection, id result, NSError *error) {
    if (error) {
      handler(@{}, error);
      return;
    }
    for (NSURL *url in toFind) {
      id nestedObject = [[result objectForKey:url.absoluteString] objectForKey:kAppLinksKey];
      NSMutableArray *rawTargets = [NSMutableArray array];
      if (idiomSpecificField) {
        [rawTargets addObjectsFromArray:[nestedObject objectForKey:idiomSpecificField]];
      }
      [rawTargets addObjectsFromArray:[nestedObject objectForKey:kIOSKey]];

      NSMutableArray<FBSDKAppLinkTarget *> *targets = [NSMutableArray arrayWithCapacity:rawTargets.count];
      for (id rawTarget in rawTargets) {
        [targets addObject:[FBSDKAppLinkTarget appLinkTargetWithURL:[NSURL URLWithString:[rawTarget objectForKey:kURLKey]]
                                                         appStoreId:[rawTarget objectForKey:kIOSAppStoreIdKey]
                                                            appName:[rawTarget objectForKey:kIOSAppNameKey]]];
      }

      id webTarget = [nestedObject objectForKey:kWebKey];
      NSString *webFallbackString = [webTarget objectForKey:kURLKey];
      NSURL *fallbackUrl = webFallbackString ? [NSURL URLWithString:webFallbackString] : url;

      NSNumber *shouldFallback = [webTarget objectForKey:kShouldFallbackKey];
      if (shouldFallback && !shouldFallback.boolValue) {
        fallbackUrl = nil;
      }

      FBSDKAppLink *link = [FBSDKAppLink appLinkWithSourceURL:url
                                                      targets:targets
                                                       webURL:fallbackUrl];
      @synchronized (self.cachedFBSDKAppLinks) {
        self.cachedFBSDKAppLinks[url] = link;
      }
      appLinks[url] = link;
    }
    handler(appLinks, nil);
  }];
}

- (BFTask *)appLinksFromURLsInBackground:(NSArray *)urls
{
  if (![FBSDKSettings clientToken] && ![FBSDKAccessToken currentAccessToken]) {
    [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorDeveloperErrors
                           logEntry:@"A user access token or clientToken is required to use FBAppLinkResolver"];
  }
  NSMutableDictionary<NSURL *, BFAppLink *> *appLinks = [NSMutableDictionary dictionary];
  NSMutableArray<NSURL *> *toFind = [NSMutableArray array];
  NSMutableArray<NSString *> *toFindStrings = [NSMutableArray array];

  @synchronized (self.cachedBFAppLinks) {
    for (NSURL *url in urls) {
      if (self.cachedBFAppLinks[url]) {
        appLinks[url] = self.cachedBFAppLinks[url];
      } else {
        [toFind addObject:url];
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
        [toFindStrings addObject:[url.absoluteString stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding]];
#pragma clang diagnostic pop
      }
    }
  }
  if (toFind.count == 0) {
    // All of the URLs have already been found.
    return [g_BFTaskClass taskWithResult:appLinks];
  }
  NSMutableArray<NSString *> *fields = [NSMutableArray arrayWithObject:kIOSKey];

  NSString *idiomSpecificField = nil;

  switch (self.userInterfaceIdiom) {
    case UIUserInterfaceIdiomPad:
      idiomSpecificField = kIPadKey;
      break;
    case UIUserInterfaceIdiomPhone:
      idiomSpecificField = kIPhoneKey;
      break;
    default:
      break;
  }
  if (idiomSpecificField) {
    [fields addObject:idiomSpecificField];
  }
  NSString *path = [NSString stringWithFormat:@"?fields=%@.fields(%@)&ids=%@",
                    kAppLinksKey,
                    [fields componentsJoinedByString:@","],
                    [toFindStrings componentsJoinedByString:@","]];
  FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc] initWithGraphPath:path
                                                                 parameters:nil
                                                                      flags:FBSDKGraphRequestFlagDoNotInvalidateTokenOnError | FBSDKGraphRequestFlagDisableErrorRecovery];
  BFTaskCompletionSource *tcs = [g_BFTaskCompletionSourceClass taskCompletionSource];
  [request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection, id result, NSError *error) {
    if (error) {
      [tcs setError:error];
      return;
    }
    for (NSURL *url in toFind) {
      id nestedObject = [[result objectForKey:url.absoluteString] objectForKey:kAppLinksKey];
      NSMutableArray *rawTargets = [NSMutableArray array];
      if (idiomSpecificField) {
        [rawTargets addObjectsFromArray:[nestedObject objectForKey:idiomSpecificField]];
      }
      [rawTargets addObjectsFromArray:[nestedObject objectForKey:kIOSKey]];

      NSMutableArray<BFAppLinkTarget *> *targets = [NSMutableArray arrayWithCapacity:rawTargets.count];
      for (id rawTarget in rawTargets) {
        [targets addObject:[g_BFAppLinkTargetClass appLinkTargetWithURL:[NSURL URLWithString:[rawTarget objectForKey:kURLKey]]
                                                             appStoreId:[rawTarget objectForKey:kIOSAppStoreIdKey]
                                                                appName:[rawTarget objectForKey:kIOSAppNameKey]]];
      }

      id webTarget = [nestedObject objectForKey:kWebKey];
      NSString *webFallbackString = [webTarget objectForKey:kURLKey];
      NSURL *fallbackUrl = webFallbackString ? [NSURL URLWithString:webFallbackString] : url;

      NSNumber *shouldFallback = [webTarget objectForKey:kShouldFallbackKey];
      if (shouldFallback && !shouldFallback.boolValue) {
        fallbackUrl = nil;
      }

      BFAppLink *link = [g_BFAppLinkClass appLinkWithSourceURL:url
                                                       targets:targets
                                                        webURL:fallbackUrl];
      @synchronized (self.cachedBFAppLinks) {
        self.cachedBFAppLinks[url] = link;
      }
      appLinks[url] = link;
    }
    [tcs setResult:appLinks];
  }];
  return tcs.task;
}

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
- (BFTask *)appLinkFromURLInBackground:(NSURL *)url
{
  // Implement in terms of appLinksFromURLsInBackground
  BFTask *resolveTask = [self appLinksFromURLsInBackground:@[url]];
  return [resolveTask continueWithSuccessBlock:^id(BFTask *task) {
    return task.result[url];
  }];
}
#pragma clang diagnostic pop

+ (id)resolver
{
  return [[self alloc] initWithUserInterfaceIdiom:UI_USER_INTERFACE_IDIOM()];
}

@end
