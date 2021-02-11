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

 #import "FBSDKAppLinkTarget.h"
 #import "FBSDKAppLink_Internal.h"
 #import "FBSDKCoreKit+Internal.h"
 #import "FBSDKMeasurementEvent_Internal.h"
 #import "FBSDKSettings.h"
 #import "FBSDKURL_Internal.h"

NSString *const AutoAppLinkFlagKey = @"is_auto_applink";

@implementation FBSDKURL

- (instancetype)initWithURL:(NSURL *)url forOpenInboundURL:(BOOL)forOpenURLEvent sourceApplication:(NSString *)sourceApplication forRenderBackToReferrerBar:(BOOL)forRenderBackToReferrerBar
{
  self = [super init];
  if (!self) {
    return nil;
  }

  _inputURL = url;
  _targetURL = url;

  // Parse the query string parameters for the base URL
  NSDictionary<NSString *, id> *baseQuery = [FBSDKURL queryParametersForURL:url];
  _inputQueryParameters = baseQuery;
  _targetQueryParameters = baseQuery;

  // Check for applink_data
  NSString *appLinkDataString = baseQuery[FBSDKAppLinkDataParameterName];
  if (appLinkDataString) {
    // Try to parse the JSON
    NSError *error = nil;
    NSDictionary<NSString *, id> *applinkData =
    [FBSDKTypeUtility JSONObjectWithData:[appLinkDataString dataUsingEncoding:NSUTF8StringEncoding]
                                 options:0
                                   error:&error];
    if (!error && [applinkData isKindOfClass:[NSDictionary class]]) {
      // If the version is not specified, assume it is 1.
      NSString *version = applinkData[FBSDKAppLinkVersionKeyName] ?: @"1.0";
      NSString *target = applinkData[FBSDKAppLinkTargetKeyName];
      if ([version isKindOfClass:[NSString class]]
          && [version isEqual:FBSDKAppLinkVersion]) {
        // There's applink data!  The target should actually be the applink target.
        _appLinkData = applinkData;
        id applinkExtras = applinkData[FBSDKAppLinkExtrasKeyName];
        if (applinkExtras && [applinkExtras isKindOfClass:[NSDictionary class]]) {
          _appLinkExtras = applinkExtras;
        }
        _targetURL = ([target isKindOfClass:[NSString class]] ? [NSURL URLWithString:target] : url);
        _targetQueryParameters = [FBSDKURL queryParametersForURL:_targetURL];

        NSDictionary<NSString *, id> *refererAppLink = _appLinkData[FBSDKAppLinkRefererAppLink];
        NSString *refererURLString = refererAppLink[FBSDKAppLinkRefererUrl];
        NSString *refererAppName = refererAppLink[FBSDKAppLinkRefererAppName];

        if (refererURLString && refererAppName) {
          FBSDKAppLinkTarget *appLinkTarget = [FBSDKAppLinkTarget appLinkTargetWithURL:[NSURL URLWithString:refererURLString]
                                                                            appStoreId:nil
                                                                               appName:refererAppName];
          _appLinkReferer = [FBSDKAppLink appLinkWithSourceURL:[NSURL URLWithString:refererURLString]
                                                       targets:@[appLinkTarget]
                                                        webURL:nil
                                              isBackToReferrer:YES];
        }

        // Raise Measurement Event
        NSString *const EVENT_YES_VAL = @"1";
        NSString *const EVENT_NO_VAL = @"0";
        NSMutableDictionary<NSString *, id> *logData = [[NSMutableDictionary alloc] init];
        [FBSDKTypeUtility dictionary:logData setObject:version forKey:@"version"];
        if (refererURLString) {
          [FBSDKTypeUtility dictionary:logData setObject:refererURLString forKey:@"refererURL"];
        }
        if (refererAppName) {
          [FBSDKTypeUtility dictionary:logData setObject:refererAppName forKey:@"refererAppName"];
        }
        if (sourceApplication) {
          [FBSDKTypeUtility dictionary:logData setObject:sourceApplication forKey:@"sourceApplication"];
        }
        if (_targetURL.absoluteString) {
          [FBSDKTypeUtility dictionary:logData setObject:_targetURL.absoluteString forKey:@"targetURL"];
        }
        if (_inputURL.absoluteString) {
          [FBSDKTypeUtility dictionary:logData setObject:_inputURL.absoluteString forKey:@"inputURL"];
        }
        if (_inputURL.scheme) {
          [FBSDKTypeUtility dictionary:logData setObject:_inputURL.scheme forKey:@"inputURLScheme"];
        }
        [FBSDKTypeUtility dictionary:logData setObject:forRenderBackToReferrerBar ? EVENT_YES_VAL : EVENT_NO_VAL forKey:@"forRenderBackToReferrerBar"];
        [FBSDKTypeUtility dictionary:logData setObject:forOpenURLEvent ? EVENT_YES_VAL : EVENT_NO_VAL forKey:@"forOpenUrl"];
        [FBSDKMeasurementEvent postNotificationForEventName:FBSDKAppLinkParseEventName args:logData];
        if (forOpenURLEvent) {
          [FBSDKMeasurementEvent postNotificationForEventName:FBSDKAppLinkNavigateInEventName args:logData];
        }
      }
    }
  }

  return self;
}

- (BOOL)isAutoAppLink
{
  NSString *host = self.targetURL.host;
  NSString *scheme = self.targetURL.scheme;
  NSString *expectedHost = @"applinks";
  NSString *expectedScheme = [NSString stringWithFormat:@"fb%@", FBSDKSettings.appID];
  BOOL autoFlag = [self.appLinkData[AutoAppLinkFlagKey] boolValue];
  return autoFlag && [expectedHost isEqual:host] && [expectedScheme isEqual:scheme];
}

+ (instancetype)URLWithURL:(NSURL *)url
{
  return [[FBSDKURL alloc] initWithURL:url forOpenInboundURL:NO sourceApplication:nil forRenderBackToReferrerBar:NO];
}

+ (instancetype)URLWithInboundURL:(NSURL *)url sourceApplication:(NSString *)sourceApplication
{
  return [[FBSDKURL alloc] initWithURL:url forOpenInboundURL:YES sourceApplication:sourceApplication forRenderBackToReferrerBar:NO];
}

+ (instancetype)URLForRenderBackToReferrerBarURL:(NSURL *)url
{
  return [[FBSDKURL alloc] initWithURL:url forOpenInboundURL:NO sourceApplication:nil forRenderBackToReferrerBar:YES];
}

+ (NSDictionary<NSString *, id> *)queryParametersForURL:(NSURL *)url
{
  NSMutableDictionary<NSString *, id> *parameters = [NSMutableDictionary dictionary];
  NSString *query = url.query;
  if ([query isEqualToString:@""]) {
    return @{};
  }
  NSArray<NSString *> *queryComponents = [query componentsSeparatedByString:@"&"];
  for (NSString *component in queryComponents) {
    NSRange equalsLocation = [component rangeOfString:@"="];
    if (equalsLocation.location == NSNotFound) {
      // There's no equals, so associate the key with NSNull
      [FBSDKTypeUtility dictionary:parameters setObject:[NSNull null] forKey:[FBSDKBasicUtility URLDecode:component]];
    } else {
      NSString *key = [FBSDKBasicUtility URLDecode:[component substringToIndex:equalsLocation.location]];
      NSString *value = [FBSDKBasicUtility URLDecode:[component substringFromIndex:equalsLocation.location + 1]];
      [FBSDKTypeUtility dictionary:parameters setObject:value forKey:key];
    }
  }
  return [NSDictionary dictionaryWithDictionary:parameters];
}

@end

#endif
