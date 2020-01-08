/*! @file OIDExternalUserAgentIOSCustomBrowser.m
    @brief AppAuth iOS SDK
    @copyright
        Copyright 2018 Google LLC
    @copydetails
        Licensed under the Apache License, Version 2.0 (the "License");
        you may not use this file except in compliance with the License.
        You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

        Unless required by applicable law or agreed to in writing, software
        distributed under the License is distributed on an "AS IS" BASIS,
        WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
        See the License for the specific language governing permissions and
        limitations under the License.
 */

#import "OIDExternalUserAgentIOSCustomBrowser.h"

#import <UIKit/UIKit.h>

#import "OIDAuthorizationRequest.h"
#import "OIDAuthorizationService.h"
#import "OIDErrorUtilities.h"
#import "OIDURLQueryComponent.h"

#if !TARGET_OS_MACCATALYST

NS_ASSUME_NONNULL_BEGIN

@implementation OIDExternalUserAgentIOSCustomBrowser

+ (instancetype)CustomBrowserChrome {
  // Chrome iOS documentation: https://developer.chrome.com/multidevice/ios/links
  OIDCustomBrowserURLTransformation transform = [[self class] URLTransformationSchemeSubstitutionHTTPS:@"googlechromes" HTTP:@"googlechrome"];
  NSURL *appStoreURL =
  [NSURL URLWithString:@"itms-apps://itunes.apple.com/us/app/chrome/id535886823"];
  return [[[self class] alloc] initWithURLTransformation:transform
                                        canOpenURLScheme:@"googlechromes"
                                             appStoreURL:appStoreURL];
}

+ (instancetype)CustomBrowserFirefox {
  // Firefox iOS documentation: https://github.com/mozilla-mobile/firefox-ios-open-in-client
  OIDCustomBrowserURLTransformation transform =
      [[self class] URLTransformationSchemeConcatPrefix:@"firefox://open-url?url="];
  NSURL *appStoreURL =
  [NSURL URLWithString:@"itms-apps://itunes.apple.com/us/app/firefox-web-browser/id989804926"];
  return [[[self class] alloc] initWithURLTransformation:transform
                                        canOpenURLScheme:@"firefox"
                                             appStoreURL:appStoreURL];
}

+ (instancetype)CustomBrowserOpera {
  OIDCustomBrowserURLTransformation transform =
      [[self class] URLTransformationSchemeSubstitutionHTTPS:@"opera-https" HTTP:@"opera-http"];
  NSURL *appStoreURL =
  [NSURL URLWithString:@"itms-apps://itunes.apple.com/us/app/opera-mini-web-browser/id363729560"];
  return [[[self class] alloc] initWithURLTransformation:transform
                                        canOpenURLScheme:@"opera-https"
                                             appStoreURL:appStoreURL];
}

+ (instancetype)CustomBrowserSafari {
  OIDCustomBrowserURLTransformation transformNOP = ^NSURL *(NSURL *requestURL) {
    return requestURL;
  };
  OIDExternalUserAgentIOSCustomBrowser *transform =
      [[[self class] alloc] initWithURLTransformation:transformNOP];
  return transform;
}

+ (OIDCustomBrowserURLTransformation)
    URLTransformationSchemeSubstitutionHTTPS:(NSString *)browserSchemeHTTPS
                                        HTTP:(nullable NSString *)browserSchemeHTTP {
  OIDCustomBrowserURLTransformation transform = ^NSURL *(NSURL *requestURL) {
    // Replace the URL Scheme with the Chrome equivalent.
    NSString *newScheme = nil;
    if ([requestURL.scheme isEqualToString:@"https"]) {
      newScheme = browserSchemeHTTPS;
    } else if ([requestURL.scheme isEqualToString:@"http"]) {
      if (!browserSchemeHTTP) {
        NSAssert(false, @"No HTTP scheme registered for browser");
        return nil;
      }
      newScheme = browserSchemeHTTP;
    }
     
    // Replaces the URI scheme with the custom scheme
    NSURLComponents *components = [NSURLComponents componentsWithURL:requestURL
                                             resolvingAgainstBaseURL:YES];
    components.scheme = newScheme;
    return components.URL;
  };
  return transform;
}

+ (OIDCustomBrowserURLTransformation)URLTransformationSchemeConcatPrefix:(NSString *)URLprefix {
  OIDCustomBrowserURLTransformation transform = ^NSURL *(NSURL *requestURL) {
    NSString *requestURLString = [requestURL absoluteString];
    NSMutableCharacterSet *allowedParamCharacters =
        [OIDURLQueryComponent URLParamValueAllowedCharacters];
    NSString *encodedUrl = [requestURLString stringByAddingPercentEncodingWithAllowedCharacters:allowedParamCharacters];
    NSString *newURL = [NSString stringWithFormat:@"%@%@", URLprefix, encodedUrl];
    return [NSURL URLWithString:newURL];
  };
  return transform;
}

- (nullable instancetype)initWithURLTransformation:
    (OIDCustomBrowserURLTransformation)URLTransformation {
  return [self initWithURLTransformation:URLTransformation canOpenURLScheme:nil appStoreURL:nil];
}

- (nullable instancetype)
    initWithURLTransformation:(OIDCustomBrowserURLTransformation)URLTransformation
             canOpenURLScheme:(nullable NSString *)canOpenURLScheme
                  appStoreURL:(nullable NSURL *)appStoreURL {
  self = [super init];
  if (self) {
    _URLTransformation = URLTransformation;
    _canOpenURLScheme = canOpenURLScheme;
    _appStoreURL = appStoreURL;
  }
  return self;
}

- (BOOL)presentExternalUserAgentRequest:(nonnull id<OIDExternalUserAgentRequest>)request
                                session:(nonnull id<OIDExternalUserAgentSession>)session {
  // If the app store URL is set, checks if the app is installed and if not opens the app store.
  if (_appStoreURL && _canOpenURLScheme) {
    // Verifies existence of LSApplicationQueriesSchemes Info.plist key.
    NSArray __unused* canOpenURLs =
        [[NSBundle mainBundle] objectForInfoDictionaryKey:@"LSApplicationQueriesSchemes"];
    NSAssert(canOpenURLs, @"plist missing LSApplicationQueriesSchemes key");
    NSAssert1([canOpenURLs containsObject:_canOpenURLScheme],
              @"plist missing LSApplicationQueriesSchemes entry for '%@'", _canOpenURLScheme);

    // Opens AppStore if app isn't installed
    NSString *testURLString = [NSString stringWithFormat:@"%@://example.com", _canOpenURLScheme];
    NSURL *testURL = [NSURL URLWithString:testURLString];
    if (![[UIApplication sharedApplication] canOpenURL:testURL]) {
      [[UIApplication sharedApplication] openURL:_appStoreURL];
      return NO;
    }
  }
  
  // Transforms the request URL and opens it.
  NSURL *requestURL = [request externalUserAgentRequestURL];
  requestURL = _URLTransformation(requestURL);
  BOOL openedInBrowser = [[UIApplication sharedApplication] openURL:requestURL];
  return openedInBrowser;
}

- (void)dismissExternalUserAgentAnimated:(BOOL)animated
                                completion:(nonnull void (^)(void))completion {
  completion();
}

@end

NS_ASSUME_NONNULL_END

#endif // !TARGET_OS_MACCATALYST
