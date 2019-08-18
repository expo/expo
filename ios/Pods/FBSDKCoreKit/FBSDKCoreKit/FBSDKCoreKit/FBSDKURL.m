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

#import "FBSDKURL_Internal.h"

#import "FBSDKAppLinkTarget.h"
#import "FBSDKAppLink_Internal.h"
#import "FBSDKMeasurementEvent_Internal.h"

@implementation FBSDKURL

- (instancetype)initWithURL:(NSURL *)url forOpenInboundURL:(BOOL)forOpenURLEvent sourceApplication:(NSString *)sourceApplication forRenderBackToReferrerBar:(BOOL)forRenderBackToReferrerBar {
    self = [super init];
    if (!self) return nil;

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
         [NSJSONSerialization JSONObjectWithData:[appLinkDataString dataUsingEncoding:NSUTF8StringEncoding]
                                         options:0
                                           error:&error];
        if (!error && [applinkData isKindOfClass:[NSDictionary class]]) {
            // If the version is not specified, assume it is 1.
            NSString *version = applinkData[FBSDKAppLinkVersionKeyName] ?: @"1.0";
            NSString *target = applinkData[FBSDKAppLinkTargetKeyName];
            if ([version isKindOfClass:[NSString class]] &&
                [version isEqual:FBSDKAppLinkVersion]) {
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
                                                              targets:@[ appLinkTarget ]
                                                               webURL:nil
                                                     isBackToReferrer:YES];
                }

                // Raise Measurement Event
                NSString *const EVENT_YES_VAL = @"1";
                NSString *const EVENT_NO_VAL = @"0";
                NSMutableDictionary<NSString *, id> *logData = [[NSMutableDictionary alloc] init];
                logData[@"version"] = version;
                if (refererURLString) {
                    logData[@"refererURL"] = refererURLString;
                }
                if (refererAppName) {
                    logData[@"refererAppName"] = refererAppName;
                }
                if (sourceApplication) {
                    logData[@"sourceApplication"] = sourceApplication;
                }
                if (_targetURL.absoluteString) {
                    logData[@"targetURL"] = _targetURL.absoluteString;
                }
                if (_inputURL.absoluteString) {
                    logData[@"inputURL"] = _inputURL.absoluteString;
                }
                if (_inputURL.scheme) {
                    logData[@"inputURLScheme"] = _inputURL.scheme;
                }
                logData[@"forRenderBackToReferrerBar"] = forRenderBackToReferrerBar ? EVENT_YES_VAL : EVENT_NO_VAL;
                logData[@"forOpenUrl"] = forOpenURLEvent ? EVENT_YES_VAL : EVENT_NO_VAL;
                [FBSDKMeasurementEvent postNotificationForEventName:FBSDKAppLinkParseEventName args:logData];
                if (forOpenURLEvent) {
                    [FBSDKMeasurementEvent postNotificationForEventName:FBSDKAppLinkNavigateInEventName args:logData];
                }
            }
        }
    }

    return self;
}

+ (FBSDKURL *)URLWithURL:(NSURL *)url {
    return [[FBSDKURL alloc] initWithURL:url forOpenInboundURL:NO sourceApplication:nil forRenderBackToReferrerBar:NO];
}

+ (FBSDKURL *)URLWithInboundURL:(NSURL *)url sourceApplication:(NSString *)sourceApplication {
    return [[FBSDKURL alloc] initWithURL:url forOpenInboundURL:YES sourceApplication:sourceApplication forRenderBackToReferrerBar:NO];
}

+ (FBSDKURL *)URLForRenderBackToReferrerBarURL:(NSURL *)url {
    return [[FBSDKURL alloc] initWithURL:url forOpenInboundURL:NO sourceApplication:nil forRenderBackToReferrerBar:YES];
}

+ (NSString *)decodeURLString:(NSString *)string {
    return (NSString *)CFBridgingRelease(CFURLCreateStringByReplacingPercentEscapes(NULL,
                                                                                    (CFStringRef)string,
                                                                                    CFSTR("")));
}

+ (NSDictionary<NSString *, id> *)queryParametersForURL:(NSURL *)url {
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
            parameters[[self decodeURLString:component]] = [NSNull null];
        } else {
            NSString *key = [self decodeURLString:[component substringToIndex:equalsLocation.location]];
            NSString *value = [self decodeURLString:[component substringFromIndex:equalsLocation.location + 1]];
            parameters[key] = value;
        }
    }
    return [NSDictionary dictionaryWithDictionary:parameters];
}

@end
