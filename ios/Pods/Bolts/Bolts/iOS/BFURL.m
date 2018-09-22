/*
 *  Copyright (c) 2014, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

#import "BFURL_Internal.h"
#import "BFAppLink_Internal.h"
#import "BFAppLinkTarget.h"
#import "BFMeasurementEvent_Internal.h"

@implementation BFURL

- (instancetype)initWithURL:(NSURL *)url forOpenInboundURL:(BOOL)forOpenURLEvent sourceApplication:(NSString *)sourceApplication forRenderBackToReferrerBar:(BOOL)forRenderBackToReferrerBar {
    self = [super init];
    if (!self) return nil;

    _inputURL = url;
    _targetURL = url;

    // Parse the query string parameters for the base URL
    NSDictionary *baseQuery = [BFURL queryParametersForURL:url];
    _inputQueryParameters = baseQuery;
    _targetQueryParameters = baseQuery;

    // Check for applink_data
    NSString *appLinkDataString = baseQuery[BFAppLinkDataParameterName];
    if (appLinkDataString) {
        // Try to parse the JSON
        NSError *error = nil;
        NSDictionary *applinkData = [NSJSONSerialization JSONObjectWithData:[appLinkDataString dataUsingEncoding:NSUTF8StringEncoding]
                                                                    options:0
                                                                      error:&error];
        if (!error && [applinkData isKindOfClass:[NSDictionary class]]) {
            // If the version is not specified, assume it is 1.
            NSString *version = applinkData[BFAppLinkVersionKeyName] ?: @"1.0";
            NSString *target = applinkData[BFAppLinkTargetKeyName];
            if ([version isKindOfClass:[NSString class]] &&
                [version isEqual:BFAppLinkVersion]) {
                // There's applink data!  The target should actually be the applink target.
                _appLinkData = applinkData;
                id applinkExtras = applinkData[BFAppLinkExtrasKeyName];
                if (applinkExtras && [applinkExtras isKindOfClass:[NSDictionary class]]) {
                    _appLinkExtras = applinkExtras;
                }
                _targetURL = ([target isKindOfClass:[NSString class]] ? [NSURL URLWithString:target] : url);
                _targetQueryParameters = [BFURL queryParametersForURL:_targetURL];

                NSDictionary *refererAppLink = _appLinkData[BFAppLinkRefererAppLink];
                NSString *refererURLString = refererAppLink[BFAppLinkRefererUrl];
                NSString *refererAppName = refererAppLink[BFAppLinkRefererAppName];

                if (refererURLString && refererAppName) {
                    BFAppLinkTarget *appLinkTarget = [BFAppLinkTarget appLinkTargetWithURL:[NSURL URLWithString:refererURLString]
                                                                                appStoreId:nil
                                                                                   appName:refererAppName];
                    _appLinkReferer = [BFAppLink appLinkWithSourceURL:[NSURL URLWithString:refererURLString]
                                                              targets:@[ appLinkTarget ]
                                                               webURL:nil
                                                     isBackToReferrer:YES];
                }

                // Raise Measurement Event
                NSString *const EVENT_YES_VAL = @"1";
                NSString *const EVENT_NO_VAL = @"0";
                NSMutableDictionary *logData = [[NSMutableDictionary alloc] init];
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
                if ([_targetURL absoluteString]) {
                    logData[@"targetURL"] = [_targetURL absoluteString];
                }
                if ([_inputURL absoluteString]) {
                    logData[@"inputURL"] = [_inputURL absoluteString];
                }
                if ([_inputURL scheme]) {
                    logData[@"inputURLScheme"] = [_inputURL scheme];
                }
                logData[@"forRenderBackToReferrerBar"] = forRenderBackToReferrerBar ? EVENT_YES_VAL : EVENT_NO_VAL;
                logData[@"forOpenUrl"] = forOpenURLEvent ? EVENT_YES_VAL : EVENT_NO_VAL;
                [BFMeasurementEvent postNotificationForEventName:BFAppLinkParseEventName args:logData];
                if (forOpenURLEvent) {
                    [BFMeasurementEvent postNotificationForEventName:BFAppLinkNavigateInEventName args:logData];
                }
            }
        }
    }

    return self;
}

+ (BFURL *)URLWithURL:(NSURL *)url {
    return [[BFURL alloc] initWithURL:url forOpenInboundURL:NO sourceApplication:nil forRenderBackToReferrerBar:NO];
}

+ (BFURL *)URLWithInboundURL:(NSURL *)url sourceApplication:(NSString *)sourceApplication {
    return [[BFURL alloc] initWithURL:url forOpenInboundURL:YES sourceApplication:sourceApplication forRenderBackToReferrerBar:NO];
}

+ (BFURL *)URLForRenderBackToReferrerBarURL:(NSURL *)url {
    return [[BFURL alloc] initWithURL:url forOpenInboundURL:NO sourceApplication:nil forRenderBackToReferrerBar:YES];
}

+ (NSString *)decodeURLString:(NSString *)string {
    return (NSString *)CFBridgingRelease(CFURLCreateStringByReplacingPercentEscapes(NULL,
                                                                                    (CFStringRef)string,
                                                                                    CFSTR("")));
}

+ (NSDictionary *)queryParametersForURL:(NSURL *)url {
    NSMutableDictionary *parameters = [NSMutableDictionary dictionary];
    NSString *query = url.query;
    if ([query isEqualToString:@""]) {
        return @{};
    }
    NSArray *queryComponents = [query componentsSeparatedByString:@"&"];
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
