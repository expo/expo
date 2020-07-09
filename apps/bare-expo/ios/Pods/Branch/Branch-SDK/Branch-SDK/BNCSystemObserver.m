//
//  BNCSystemObserver.m
//  Branch-SDK
//
//  Created by Alex Austin on 6/5/14.
//  Copyright (c) 2014 Branch Metrics. All rights reserved.
//

#import "BNCPreferenceHelper.h"
#import "BNCSystemObserver.h"
#import "BNCLog.h"
#if __has_feature(modules)
@import UIKit;
@import SystemConfiguration;
@import Darwin.POSIX.sys.utsname;
#else
#import <UIKit/UIKit.h>
#import <SystemConfiguration/SystemConfiguration.h>
#import <sys/utsname.h>
#endif

@implementation BNCSystemObserver

+ (NSString *)getUniqueHardwareId:(BOOL *)isReal
                          isDebug:(BOOL)debug
                          andType:(NSString *__autoreleasing*)type {
    NSString *uid = nil;
    *isReal = YES;

    if (!debug) {
        uid = [self getAdId];
        *type = @"idfa";
    }

    if (!uid && NSClassFromString(@"UIDevice") && !debug) {
        uid = [[UIDevice currentDevice].identifierForVendor UUIDString];
        *type = @"vendor_id";
    }

    if (!uid) {
        uid = [[NSUUID UUID] UUIDString];
        *type = @"random";
        *isReal = NO;
    }

    return uid;
}

+ (NSString*) getAdId {
    NSString *uid = nil;

    Class ASIdentifierManagerClass = NSClassFromString(@"ASIdentifierManager");
    if (ASIdentifierManagerClass) {
        SEL sharedManagerSelector = NSSelectorFromString(@"sharedManager");
        id sharedManager =
            ((id (*)(id, SEL))[ASIdentifierManagerClass methodForSelector:sharedManagerSelector])
                (ASIdentifierManagerClass, sharedManagerSelector);
        SEL advertisingIdentifierSelector = NSSelectorFromString(@"advertisingIdentifier");
        NSUUID *uuid =
            ((NSUUID* (*)(id, SEL))[sharedManager methodForSelector:advertisingIdentifierSelector])
                (sharedManager, advertisingIdentifierSelector);
        uid = [uuid UUIDString];
        // limit ad tracking is enabled. iOS 10+
        if ([uid isEqualToString:@"00000000-0000-0000-0000-000000000000"]) {
            uid = nil;
        }
    }

    return uid;
}

+ (NSString *)getVendorId {
    NSString *vendorId = nil;
    
    if (NSClassFromString(@"UIDevice")) {
        vendorId = [[UIDevice currentDevice].identifierForVendor UUIDString];
    }
    
    return vendorId;
}

+ (BOOL)adTrackingSafe {
    Class ASIdentifierManagerClass = NSClassFromString(@"ASIdentifierManager");
    if (ASIdentifierManagerClass) {
        SEL sharedManagerSelector = NSSelectorFromString(@"sharedManager");
        id sharedManager = ((id (*)(id, SEL))[ASIdentifierManagerClass methodForSelector:sharedManagerSelector])(ASIdentifierManagerClass, sharedManagerSelector);
        SEL advertisingEnabledSelector = NSSelectorFromString(@"isAdvertisingTrackingEnabled");
        BOOL enabled = ((BOOL (*)(id, SEL))[sharedManager methodForSelector:advertisingEnabledSelector])(sharedManager, advertisingEnabledSelector);
        return enabled;
    }
    return YES;
}

+ (NSString *)getDefaultUriScheme {
    NSArray *urlTypes = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleURLTypes"];

    for (NSDictionary *urlType in urlTypes) {
        NSArray *urlSchemes = [urlType objectForKey:@"CFBundleURLSchemes"];
        for (NSString *uriScheme in urlSchemes) {
            if ([uriScheme hasPrefix:@"fb"]) continue;  // Facebook
            if ([uriScheme hasPrefix:@"db"]) continue;  // DB?
            if ([uriScheme hasPrefix:@"twitterkit-"]) continue; // Twitter
            if ([uriScheme hasPrefix:@"pdk"]) continue; // Pinterest
            if ([uriScheme hasPrefix:@"pin"]) continue; // Pinterest
            if ([uriScheme hasPrefix:@"com.googleusercontent.apps"]) continue; // Google

            // Otherwise this must be it!
            return uriScheme;
        }
    }
    return nil;
}

+ (NSString *)getAppVersion {
    return [[[NSBundle mainBundle] infoDictionary] objectForKey:@"CFBundleShortVersionString"];
}

+ (NSString *)getBundleID {
    return [[NSBundle mainBundle] bundleIdentifier];
}

+ (NSString *)getTeamIdentifier {
    NSString *teamWithDot = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"AppIdentifierPrefix"];
    if (teamWithDot.length) {
        return [teamWithDot substringToIndex:([teamWithDot length] - 1)];
    }
    return nil;
}

+ (NSString *)getBrand {
    return @"Apple";
}

+ (NSString *)getModel {
    struct utsname systemInfo;
    uname(&systemInfo);

    return [NSString stringWithCString:systemInfo.machine encoding:NSUTF8StringEncoding];
}

+ (BOOL)isSimulator {
    #if (TARGET_OS_SIMULATOR)
    return YES;
    #else
    return NO;
    #endif
}

+ (NSString *)getOS {
    return @"iOS";
}

+ (NSString *)getOSVersion {
    UIDevice *device = [UIDevice currentDevice];
    return [device systemVersion];
}

+ (NSNumber *)getScreenWidth {
    UIScreen *mainScreen = [UIScreen mainScreen];
    CGFloat scaleFactor = mainScreen.scale;
    CGFloat width = mainScreen.bounds.size.width * scaleFactor;
    return [NSNumber numberWithInteger:(NSInteger)width];
}

+ (NSNumber *)getScreenHeight {
    UIScreen *mainScreen = [UIScreen mainScreen];
    CGFloat scaleFactor = mainScreen.scale;
    CGFloat height = mainScreen.bounds.size.height * scaleFactor;
    return [NSNumber numberWithInteger:(NSInteger)height];
}

@end
