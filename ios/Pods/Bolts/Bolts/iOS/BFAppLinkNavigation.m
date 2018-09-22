/*
 *  Copyright (c) 2014, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

#import "BFAppLinkNavigation.h"

#import <Bolts/Bolts.h>

#import "BFMeasurementEvent_Internal.h"
#import "BFAppLink_Internal.h"

FOUNDATION_EXPORT NSString *const BFAppLinkDataParameterName;
FOUNDATION_EXPORT NSString *const BFAppLinkTargetKeyName;
FOUNDATION_EXPORT NSString *const BFAppLinkUserAgentKeyName;
FOUNDATION_EXPORT NSString *const BFAppLinkExtrasKeyName;
FOUNDATION_EXPORT NSString *const BFAppLinkVersionKeyName;
FOUNDATION_EXPORT NSString *const BFAppLinkRefererAppLink;
FOUNDATION_EXPORT NSString *const BFAppLinkRefererAppName;
FOUNDATION_EXPORT NSString *const BFAppLinkRefererUrl;

static id<BFAppLinkResolving> defaultResolver;

@interface BFAppLinkNavigation ()

@property (nonatomic, copy, readwrite) NSDictionary *extras;
@property (nonatomic, copy, readwrite) NSDictionary *appLinkData;
@property (nonatomic, strong, readwrite) BFAppLink *appLink;

@end

@implementation BFAppLinkNavigation

+ (instancetype)navigationWithAppLink:(BFAppLink *)appLink
                               extras:(NSDictionary *)extras
                          appLinkData:(NSDictionary *)appLinkData {
    BFAppLinkNavigation *navigation = [[self alloc] init];
    navigation.appLink = appLink;
    navigation.extras = extras;
    navigation.appLinkData = appLinkData;
    return navigation;
}

+ (NSDictionary *)callbackAppLinkDataForAppWithName:(NSString *)appName url:(NSString *)url {
    return @{BFAppLinkRefererAppLink: @{BFAppLinkRefererAppName: appName, BFAppLinkRefererUrl: url}};
}

- (NSString *)stringByEscapingQueryString:(NSString *)string {
#if __IPHONE_OS_VERSION_MIN_REQUIRED >= __IPHONE_7_0 || __MAC_OS_X_VERSION_MIN_REQUIRED >= __MAC_10_9
    return [string stringByAddingPercentEncodingWithAllowedCharacters:[NSCharacterSet URLQueryAllowedCharacterSet]];
#else
    return (NSString *)CFBridgingRelease(CFURLCreateStringByAddingPercentEscapes(NULL,
                                                                                 (CFStringRef)string,
                                                                                 NULL,
                                                                                 (CFStringRef) @":/?#[]@!$&'()*+,;=",
                                                                                 kCFStringEncodingUTF8));
#endif
}

- (NSURL *)appLinkURLWithTargetURL:(NSURL *)targetUrl error:(NSError **)error {
    NSMutableDictionary *appLinkData = [NSMutableDictionary dictionaryWithDictionary:self.appLinkData ?: @{}];

    // Add applink protocol data
    if (!appLinkData[BFAppLinkUserAgentKeyName]) {
        appLinkData[BFAppLinkUserAgentKeyName] = [NSString stringWithFormat:@"Bolts iOS %@", BoltsFrameworkVersionString];
    }
    if (!appLinkData[BFAppLinkVersionKeyName]) {
        appLinkData[BFAppLinkVersionKeyName] = BFAppLinkVersion;
    }
    appLinkData[BFAppLinkTargetKeyName] = [self.appLink.sourceURL absoluteString];
    appLinkData[BFAppLinkExtrasKeyName] = self.extras ?: @{};

    // JSON-ify the applink data
    NSError *jsonError = nil;
    NSData *jsonBlob = [NSJSONSerialization dataWithJSONObject:appLinkData options:0 error:&jsonError];
    if (!jsonError) {
        NSString *jsonString = [[NSString alloc] initWithData:jsonBlob encoding:NSUTF8StringEncoding];
        NSString *encoded = [self stringByEscapingQueryString:jsonString];

        NSString *endUrlString = [NSString stringWithFormat:@"%@%@%@=%@",
                                  [targetUrl absoluteString],
                                  targetUrl.query ? @"&" : @"?",
                                  BFAppLinkDataParameterName,
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

- (BFAppLinkNavigationType)navigate:(NSError **)error {
    NSURL *openedURL = nil;
    NSError *encodingError = nil;
    BFAppLinkNavigationType retType = BFAppLinkNavigationTypeFailure;

    // Find the first eligible/launchable target in the BFAppLink.
    for (BFAppLinkTarget *target in self.appLink.targets) {
        NSURL *appLinkAppURL = [self appLinkURLWithTargetURL:target.URL error:&encodingError];
        if (encodingError || !appLinkAppURL) {
            if (error) {
                *error = encodingError;
            }
        } else if ([[UIApplication sharedApplication] openURL:appLinkAppURL]) {
            retType = BFAppLinkNavigationTypeApp;
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
            retType = BFAppLinkNavigationTypeBrowser;
            openedURL = appLinkBrowserURL;
        }
    }

    [self postAppLinkNavigateEventNotificationWithTargetURL:openedURL
                                                      error:error ? *error : nil
                                                       type:retType];
    return retType;
}

- (void)postAppLinkNavigateEventNotificationWithTargetURL:(NSURL *)outputURL error:(NSError *)error type:(BFAppLinkNavigationType)type {
    NSString *const EVENT_YES_VAL = @"1";
    NSString *const EVENT_NO_VAL = @"0";
    NSMutableDictionary *logData = [[NSMutableDictionary alloc] init];

    NSString *outputURLScheme = [outputURL scheme];
    NSString *outputURLString = [outputURL absoluteString];
    if (outputURLScheme) {
        logData[@"outputURLScheme"] = outputURLScheme;
    }
    if (outputURLString) {
        logData[@"outputURL"] = outputURLString;
    }

    NSString *sourceURLString = [self.appLink.sourceURL absoluteString];
    NSString *sourceURLHost = [self.appLink.sourceURL host];
    NSString *sourceURLScheme = [self.appLink.sourceURL scheme];
    if (sourceURLString) {
        logData[@"sourceURL"] = sourceURLString;
    }
    if (sourceURLHost) {
        logData[@"sourceHost"] = sourceURLHost;
    }
    if (sourceURLScheme) {
        logData[@"sourceScheme"] = sourceURLScheme;
    }
    if ([error localizedDescription]) {
        logData[@"error"] = [error localizedDescription];
    }
    NSString *success = nil; //no
    NSString *linkType = nil; // unknown;
    switch (type) {
        case BFAppLinkNavigationTypeFailure:
            success = EVENT_NO_VAL;
            linkType = @"fail";
            break;
        case BFAppLinkNavigationTypeBrowser:
            success = EVENT_YES_VAL;
            linkType = @"web";
            break;
        case BFAppLinkNavigationTypeApp:
            success = EVENT_YES_VAL;
            linkType = @"app";
            break;
        default:
            break;
    }
    if (success) {
        logData[@"success"] = success;
    }
    if (linkType) {
        logData[@"type"] = linkType;
    }

    if ([self.appLink isBackToReferrer]) {
        [BFMeasurementEvent postNotificationForEventName:BFAppLinkNavigateBackToReferrerEventName args:logData];
    } else {
        [BFMeasurementEvent postNotificationForEventName:BFAppLinkNavigateOutEventName args:logData];
    }
}

+ (BFTask *)resolveAppLinkInBackground:(NSURL *)destination resolver:(id<BFAppLinkResolving>)resolver {
    return [resolver appLinkFromURLInBackground:destination];
}

+ (BFTask *)resolveAppLinkInBackground:(NSURL *)destination {
    return [self resolveAppLinkInBackground:destination resolver:[self defaultResolver]];
}

+ (BFTask *)navigateToURLInBackground:(NSURL *)destination {
    return [self navigateToURLInBackground:destination
                                  resolver:[self defaultResolver]];
}

+ (BFTask *)navigateToURLInBackground:(NSURL *)destination
                             resolver:(id<BFAppLinkResolving>)resolver {
    BFTask *resolutionTask = [self resolveAppLinkInBackground:destination
                                                     resolver:resolver];
    return [resolutionTask continueWithExecutor:[BFExecutor mainThreadExecutor]
                               withSuccessBlock:^id(BFTask *task) {
                                   NSError *error = nil;
                                   BFAppLinkNavigationType result = [self navigateToAppLink:task.result
                                                                                      error:&error];
                                   if (error) {
                                       return [BFTask taskWithError:error];
                                   } else {
                                       return @(result);
                                   }
                               }];
}

+ (BFAppLinkNavigationType)navigateToAppLink:(BFAppLink *)link error:(NSError **)error {
    return [[BFAppLinkNavigation navigationWithAppLink:link
                                                extras:nil
                                           appLinkData:nil] navigate:error];
}

+ (BFAppLinkNavigationType)navigationTypeForLink:(BFAppLink *)link {
    return [[self navigationWithAppLink:link extras:nil appLinkData:nil] navigationType];
}

- (BFAppLinkNavigationType)navigationType {
    BFAppLinkTarget *eligibleTarget = nil;
    for (BFAppLinkTarget *target in self.appLink.targets) {
        if ([[UIApplication sharedApplication] canOpenURL:target.URL]) {
            eligibleTarget = target;
            break;
        }
    }

    if (eligibleTarget != nil) {
        NSURL *appLinkURL = [self appLinkURLWithTargetURL:eligibleTarget.URL error:nil];
        if (appLinkURL != nil) {
            return BFAppLinkNavigationTypeApp;
        } else {
            return BFAppLinkNavigationTypeFailure;
        }
    }

    if (self.appLink.webURL != nil) {
        NSURL *appLinkURL = [self appLinkURLWithTargetURL:eligibleTarget.URL error:nil];
        if (appLinkURL != nil) {
            return BFAppLinkNavigationTypeBrowser;
        } else {
            return BFAppLinkNavigationTypeFailure;
        }
    }

    return BFAppLinkNavigationTypeFailure;
}

+ (id<BFAppLinkResolving>)defaultResolver {
    if (defaultResolver) {
        return defaultResolver;
    }
    return [BFWebViewAppLinkResolver sharedInstance];
}

+ (void)setDefaultResolver:(id<BFAppLinkResolving>)resolver {
    defaultResolver = resolver;
}

@end
