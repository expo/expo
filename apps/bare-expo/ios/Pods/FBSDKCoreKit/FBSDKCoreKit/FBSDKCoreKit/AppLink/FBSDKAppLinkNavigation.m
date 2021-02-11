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

 #import "FBSDKAppLinkNavigation.h"

 #import "FBSDKAppLinkTarget.h"
 #import "FBSDKAppLink_Internal.h"
 #import "FBSDKInternalUtility.h"
 #import "FBSDKMeasurementEvent_Internal.h"
 #import "FBSDKSettings.h"
 #import "FBSDKWebViewAppLinkResolver.h"

FOUNDATION_EXPORT NSString *const FBSDKAppLinkDataParameterName;
FOUNDATION_EXPORT NSString *const FBSDKAppLinkTargetKeyName;
FOUNDATION_EXPORT NSString *const FBSDKAppLinkUserAgentKeyName;
FOUNDATION_EXPORT NSString *const FBSDKAppLinkExtrasKeyName;
FOUNDATION_EXPORT NSString *const FBSDKAppLinkVersionKeyName;
FOUNDATION_EXPORT NSString *const FBSDKAppLinkRefererAppLink;
FOUNDATION_EXPORT NSString *const FBSDKAppLinkRefererAppName;
FOUNDATION_EXPORT NSString *const FBSDKAppLinkRefererUrl;

static id<FBSDKAppLinkResolving> defaultResolver;

@interface FBSDKAppLinkNavigation ()

@property (nonatomic, copy) NSDictionary<NSString *, id> *extras;
@property (nonatomic, copy) NSDictionary<NSString *, id> *appLinkData;
@property (nonatomic, strong) FBSDKAppLink *appLink;

@end

@implementation FBSDKAppLinkNavigation

+ (instancetype)navigationWithAppLink:(FBSDKAppLink *)appLink
                               extras:(NSDictionary<NSString *, id> *)extras
                          appLinkData:(NSDictionary<NSString *, id> *)appLinkData
{
  FBSDKAppLinkNavigation *navigation = [[self alloc] init];
  navigation.appLink = appLink;
  navigation.extras = extras;
  navigation.appLinkData = appLinkData;
  return navigation;
}

+ (NSDictionary<NSString *, NSDictionary<NSString *, NSString *> *> *)callbackAppLinkDataForAppWithName:(NSString *)appName
                                                                                                    url:(NSString *)url
{
  return @{FBSDKAppLinkRefererAppLink : @{FBSDKAppLinkRefererAppName : appName, FBSDKAppLinkRefererUrl : url}};
}

- (NSString *)stringByEscapingQueryString:(NSString *)string
{
  return [string stringByAddingPercentEncodingWithAllowedCharacters:[NSCharacterSet URLQueryAllowedCharacterSet]];
}

- (NSURL *)appLinkURLWithTargetURL:(NSURL *)targetUrl error:(NSError **)error
{
  NSMutableDictionary<NSString *, id> *appLinkData =
  [NSMutableDictionary dictionaryWithDictionary:self.appLinkData ?: @{}];

  // Add applink protocol data
  if (!appLinkData[FBSDKAppLinkUserAgentKeyName]) {
    [FBSDKTypeUtility dictionary:appLinkData setObject:[NSString stringWithFormat:@"FBSDK %@", FBSDKSettings.sdkVersion] forKey:FBSDKAppLinkUserAgentKeyName];
  }
  if (!appLinkData[FBSDKAppLinkVersionKeyName]) {
    [FBSDKTypeUtility dictionary:appLinkData setObject:FBSDKAppLinkVersion forKey:FBSDKAppLinkVersionKeyName];
  }
  if (self.appLink.sourceURL.absoluteString) {
    [FBSDKTypeUtility dictionary:appLinkData setObject:self.appLink.sourceURL.absoluteString forKey:FBSDKAppLinkTargetKeyName];
  }
  [FBSDKTypeUtility dictionary:appLinkData setObject:self.extras ?: @{} forKey:FBSDKAppLinkExtrasKeyName];

  // JSON-ify the applink data
  NSError *jsonError = nil;
  NSData *jsonBlob = [FBSDKTypeUtility dataWithJSONObject:appLinkData options:0 error:&jsonError];
  if (!jsonError) {
    NSString *jsonString = [[NSString alloc] initWithData:jsonBlob encoding:NSUTF8StringEncoding];
    NSString *encoded = [self stringByEscapingQueryString:jsonString];

    NSString *endUrlString = [NSString stringWithFormat:@"%@%@%@=%@",
                              targetUrl.absoluteString,
                              targetUrl.query ? @"&" : @"?",
                              FBSDKAppLinkDataParameterName,
                              encoded];

    return [NSURL URLWithString:endUrlString];
  } else {
    if (error) {
      *error = jsonError;
    }

    // If there was an error encoding the app link data, fail hard.
    return nil;
  }
}

- (FBSDKAppLinkNavigationType)navigate:(NSError **)error
{
  #pragma clang diagnostic push
  #pragma clang diagnostic ignored "-Wdeprecated-declarations"
  NSURL *openedURL = nil;
  NSError *encodingError = nil;
  FBSDKAppLinkNavigationType retType = FBSDKAppLinkNavigationTypeFailure;

  // Find the first eligible/launchable target in the FBSDKAppLink.
  for (FBSDKAppLinkTarget *target in self.appLink.targets) {
    NSURL *appLinkAppURL = [self appLinkURLWithTargetURL:target.URL error:&encodingError];
    if (encodingError || !appLinkAppURL) {
      if (error) {
        *error = encodingError;
      }
    } else if ([[UIApplication sharedApplication] openURL:appLinkAppURL]) {
      retType = FBSDKAppLinkNavigationTypeApp;
      openedURL = appLinkAppURL;
      break;
    }
  }

  if (!openedURL && self.appLink.webURL) {
    // Fall back to opening the url in the browser if available.
    NSURL *appLinkBrowserURL = [self appLinkURLWithTargetURL:self.appLink.webURL error:&encodingError];
    if (encodingError || !appLinkBrowserURL) {
      // If there was an error encoding the app link data, fail hard.
      if (error) {
        *error = encodingError;
      }
    } else if ([[UIApplication sharedApplication] openURL:appLinkBrowserURL]) {
      // This was a browser navigation.
      retType = FBSDKAppLinkNavigationTypeBrowser;
      openedURL = appLinkBrowserURL;
    }
  }
  #pragma clang diagnostic pop

  [self postAppLinkNavigateEventNotificationWithTargetURL:openedURL
                                                    error:error ? *error : nil
                                                     type:retType];
  return retType;
}

- (void)postAppLinkNavigateEventNotificationWithTargetURL:(NSURL *)outputURL error:(NSError *)error type:(FBSDKAppLinkNavigationType)type
{
  NSString *const EVENT_YES_VAL = @"1";
  NSString *const EVENT_NO_VAL = @"0";
  NSMutableDictionary<NSString *, id> *logData =
  [[NSMutableDictionary alloc] init];

  NSString *outputURLScheme = outputURL.scheme;
  NSString *outputURLString = outputURL.absoluteString;
  if (outputURLScheme) {
    [FBSDKTypeUtility dictionary:logData setObject:outputURLScheme forKey:@"outputURLScheme"];
  }
  if (outputURLString) {
    [FBSDKTypeUtility dictionary:logData setObject:outputURLString forKey:@"outputURL"];
  }

  NSString *sourceURLString = self.appLink.sourceURL.absoluteString;
  NSString *sourceURLHost = self.appLink.sourceURL.host;
  NSString *sourceURLScheme = self.appLink.sourceURL.scheme;
  if (sourceURLString) {
    [FBSDKTypeUtility dictionary:logData setObject:sourceURLString forKey:@"sourceURL"];
  }
  if (sourceURLHost) {
    [FBSDKTypeUtility dictionary:logData setObject:sourceURLHost forKey:@"sourceHost"];
  }
  if (sourceURLScheme) {
    [FBSDKTypeUtility dictionary:logData setObject:sourceURLScheme forKey:@"sourceScheme"];
  }
  if (error.localizedDescription) {
    [FBSDKTypeUtility dictionary:logData setObject:error.localizedDescription forKey:@"error"];
  }
  NSString *success = nil; // no
  NSString *linkType = nil; // unknown;
  switch (type) {
    case FBSDKAppLinkNavigationTypeFailure:
      success = EVENT_NO_VAL;
      linkType = @"fail";
      break;
    case FBSDKAppLinkNavigationTypeBrowser:
      success = EVENT_YES_VAL;
      linkType = @"web";
      break;
    case FBSDKAppLinkNavigationTypeApp:
      success = EVENT_YES_VAL;
      linkType = @"app";
      break;
    default:
      break;
  }
  if (success) {
    [FBSDKTypeUtility dictionary:logData setObject:success forKey:@"success"];
  }
  if (linkType) {
    [FBSDKTypeUtility dictionary:logData setObject:linkType forKey:@"type"];
  }

  if (self.appLink.backToReferrer) {
    [FBSDKMeasurementEvent postNotificationForEventName:FBSDKAppLinkNavigateBackToReferrerEventName args:logData];
  } else {
    [FBSDKMeasurementEvent postNotificationForEventName:FBSDKAppLinkNavigateOutEventName args:logData];
  }
}

+ (void)resolveAppLink:(NSURL *)destination
              resolver:(id<FBSDKAppLinkResolving>)resolver
               handler:(FBSDKAppLinkBlock)handler
{
  [resolver appLinkFromURL:destination handler:handler];
}

+ (void)resolveAppLink:(NSURL *)destination handler:(FBSDKAppLinkBlock)handler
{
  [self resolveAppLink:destination resolver:[self defaultResolver] handler:handler];
}

+ (void)navigateToURL:(NSURL *)destination handler:(FBSDKAppLinkNavigationBlock)handler
{
  [self navigateToURL:destination resolver:[self defaultResolver] handler:handler];
}

+ (void)navigateToURL:(NSURL *)destination
             resolver:(id<FBSDKAppLinkResolving>)resolver
              handler:(FBSDKAppLinkNavigationBlock)handler
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [self resolveAppLink:destination
                resolver:resolver
                 handler:^(FBSDKAppLink *_Nullable appLink, NSError *_Nullable error) {
                   if (error) {
                     handler(FBSDKAppLinkNavigationTypeFailure, error);
                     return;
                   }

                   NSError *navigateError = nil;
                   FBSDKAppLinkNavigationType result = [self navigateToAppLink:appLink error:&navigateError];
                   handler(result, navigateError);
                 }];
  });
}

+ (FBSDKAppLinkNavigationType)navigateToAppLink:(FBSDKAppLink *)link error:(NSError **)error
{
  return [[FBSDKAppLinkNavigation navigationWithAppLink:link
                                                 extras:@{}
                                            appLinkData:@{}] navigate:error];
}

+ (FBSDKAppLinkNavigationType)navigationTypeForLink:(FBSDKAppLink *)link
{
  return [[self navigationWithAppLink:link extras:@{} appLinkData:@{}] navigationType];
}

- (FBSDKAppLinkNavigationType)navigationType
{
  FBSDKAppLinkTarget *eligibleTarget = nil;
  for (FBSDKAppLinkTarget *target in self.appLink.targets) {
    if ([[UIApplication sharedApplication] canOpenURL:target.URL]) {
      eligibleTarget = target;
      break;
    }
  }

  if (eligibleTarget != nil) {
    NSURL *appLinkURL = [self appLinkURLWithTargetURL:eligibleTarget.URL error:nil];
    if (appLinkURL != nil) {
      return FBSDKAppLinkNavigationTypeApp;
    } else {
      return FBSDKAppLinkNavigationTypeFailure;
    }
  }

  if (self.appLink.webURL != nil) {
    NSURL *appLinkURL = [self appLinkURLWithTargetURL:eligibleTarget.URL error:nil];
    if (appLinkURL != nil) {
      return FBSDKAppLinkNavigationTypeBrowser;
    } else {
      return FBSDKAppLinkNavigationTypeFailure;
    }
  }

  return FBSDKAppLinkNavigationTypeFailure;
}

+ (id<FBSDKAppLinkResolving>)defaultResolver
{
  if (defaultResolver) {
    return defaultResolver;
  }
  return [FBSDKWebViewAppLinkResolver sharedInstance];
}

+ (void)setDefaultResolver:(id<FBSDKAppLinkResolving>)resolver
{
  defaultResolver = resolver;
}

@end

#endif
