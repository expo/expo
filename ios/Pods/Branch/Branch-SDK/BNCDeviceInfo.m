//
//  BNCDeviceInfo.m
//  Branch-TestBed
//
//  Created by Sojan P.R. on 3/22/16.
//  Copyright © 2016 Branch Metrics. All rights reserved.
//
#import "BNCDeviceInfo.h"
#import "BNCPreferenceHelper.h"
#import "BNCSystemObserver.h"
#import "BNCAvailability.h"
#import "BNCLog.h"
#import "BNCConfig.h"
#import "BNCNetworkInterface.h"
#import "BNCReachability.h"
#import "BNCLocale.h"
#import "NSMutableDictionary+Branch.h"
#import "BNCDeviceSystem.h"

#if !TARGET_OS_TV
// tvOS does not support webkit or telephony
#import "BNCTelephony.h"
#import "BNCUserAgentCollector.h"
#endif

#if __has_feature(modules)
@import UIKit;
#else
#import <UIKit/UIKit.h>
#endif

#pragma mark - BNCDeviceInfo

@interface BNCDeviceInfo()

@property (nonatomic, copy, readwrite) NSString *randomId;

@end

@implementation BNCDeviceInfo

+ (BNCDeviceInfo *)getInstance {
    static BNCDeviceInfo *bnc_deviceInfo = 0;
    static dispatch_once_t onceToken = 0;
    dispatch_once(&onceToken, ^{
        bnc_deviceInfo = [BNCDeviceInfo new];
    });
    return bnc_deviceInfo;
}

- (instancetype)init {
    self = [super init];
    if (self) {
        [self loadDeviceInfo];
    }
    return self;
}

- (void)registerPluginName:(NSString *)name version:(NSString *)version {
    @synchronized (self) {
        self.pluginName = name;
        self.pluginVersion = version;
    }
}

- (void)loadDeviceInfo {

    BNCLocale *locale = [BNCLocale new];
    BNCDeviceSystem *deviceSystem = [BNCDeviceSystem new];

    // The random id is regenerated per app launch.  This maintains existing behavior.
    self.randomId = [[NSUUID UUID] UUIDString];
    self.vendorId = [BNCSystemObserver getVendorId];
    [self checkAdvertisingIdentifier];

    self.brandName = [BNCSystemObserver getBrand];
    self.modelName = [BNCSystemObserver getModel];
    self.osName = [BNCSystemObserver getOS];
    self.osVersion = [BNCSystemObserver getOSVersion];
    self.osBuildVersion = deviceSystem.systemBuildVersion;

    if (deviceSystem.cpuType) {
        self.cpuType = [deviceSystem.cpuType stringValue];
    }

    self.screenWidth = [BNCSystemObserver getScreenWidth];
    self.screenHeight = [BNCSystemObserver getScreenHeight];
    self.screenScale = @([UIScreen mainScreen].scale);

    #if !TARGET_OS_TV
    BNCTelephony *telephony = [BNCTelephony new];
    self.carrierName = telephony.carrierName;
    #endif

    self.locale = [NSLocale currentLocale].localeIdentifier;
    self.country = [locale country];
    self.language = [locale language];
    self.extensionType = [self extensionType];
    self.branchSDKVersion = [NSString stringWithFormat:@"ios%@", BNC_SDK_VERSION];
    self.applicationVersion = [NSBundle mainBundle].infoDictionary[@"CFBundleShortVersionString"];
    if (!self.applicationVersion.length) {
        self.applicationVersion = [NSBundle mainBundle].infoDictionary[@"CFBundleVersionKey"];
    }
}

- (NSString *)extensionType {
    NSString *result = @"FULL_APP";
    NSString *extensionType = [NSBundle mainBundle].infoDictionary[@"NSExtension"][@"NSExtensionPointIdentifier"];
    if ([extensionType isEqualToString:@"com.apple.identitylookup.message-filter"]) {
        result = @"IMESSAGE_APP";
    }
    return result;
}

- (NSString *)localIPAddress {
    return [BNCNetworkInterface localIPAddress];
}

- (NSString *)connectionType {
    return [[BNCReachability shared] reachabilityStatus];
}

- (NSString *)userAgentString {
    #if !TARGET_OS_TV
    return [BNCUserAgentCollector instance].userAgent;
    #else
    // tvOS has no web browser or webview
    return @"";
    #endif
}

// IDFA should never be cached
- (void)checkAdvertisingIdentifier {
    self.isAdTrackingEnabled = [BNCSystemObserver adTrackingSafe];
    self.advertiserId = [BNCSystemObserver getAdId];
    BOOL ignoreIdfa = [BNCPreferenceHelper preferenceHelper].isDebug;

    if (self.advertiserId && !ignoreIdfa) {
        self.hardwareId = self.advertiserId;
        self.hardwareIdType = @"idfa";
        self.isRealHardwareId = YES;

    } else if (self.vendorId) {
        self.hardwareId = self.vendorId;
        self.hardwareIdType = @"vendor_id";
        self.isRealHardwareId = YES;

    } else {
        self.hardwareId = self.randomId;
        self.hardwareIdType = @"random";
        self.isRealHardwareId = NO;
    }
}

- (NSDictionary *)v2dictionary {
    NSMutableDictionary *dictionary = [NSMutableDictionary new];
    @synchronized (self) {
        [self checkAdvertisingIdentifier];

        BOOL disableAdNetworkCallouts = [BNCPreferenceHelper preferenceHelper].disableAdNetworkCallouts;
        if (disableAdNetworkCallouts) {
            dictionary[@"disable_ad_network_callouts"] = [NSNumber numberWithBool:disableAdNetworkCallouts];
        }

        if ([BNCPreferenceHelper preferenceHelper].isDebug) {
            dictionary[@"unidentified_device"] = @(YES);
        } else {
            [dictionary bnc_safeSetObject:self.vendorId forKey:@"idfv"];
            [dictionary bnc_safeSetObject:self.advertiserId forKey:@"idfa"];
        }
        [dictionary bnc_safeSetObject:[self localIPAddress] forKey:@"local_ip"];

        if (!self.isAdTrackingEnabled) {
            dictionary[@"limit_ad_tracking"] = @(YES);
        }

        if ([BNCPreferenceHelper preferenceHelper].limitFacebookTracking) {
            dictionary[@"limit_facebook_tracking"] = @(YES);
        }
        [dictionary bnc_safeSetObject:self.brandName forKey:@"brand"];
        [dictionary bnc_safeSetObject:self.modelName forKey:@"model"];
        [dictionary bnc_safeSetObject:self.osName forKey:@"os"];
        [dictionary bnc_safeSetObject:self.osVersion forKey:@"os_version"];
        [dictionary bnc_safeSetObject:self.osBuildVersion forKey:@"build"];
        [dictionary bnc_safeSetObject:self.extensionType forKey:@"environment"];
        [dictionary bnc_safeSetObject:self.cpuType forKey:@"cpu_type"];
        [dictionary bnc_safeSetObject:self.screenScale forKey:@"screen_dpi"];
        [dictionary bnc_safeSetObject:self.screenHeight forKey:@"screen_height"];
        [dictionary bnc_safeSetObject:self.screenWidth forKey:@"screen_width"];
        [dictionary bnc_safeSetObject:self.locale forKey:@"locale"];
        [dictionary bnc_safeSetObject:self.country forKey:@"country"];
        [dictionary bnc_safeSetObject:self.language forKey:@"language"];
        [dictionary bnc_safeSetObject:self.carrierName forKey:@"device_carrier"];
        [dictionary bnc_safeSetObject:[self connectionType] forKey:@"connection_type"];
        [dictionary bnc_safeSetObject:[self userAgentString] forKey:@"user_agent"];

        [dictionary bnc_safeSetObject:[BNCPreferenceHelper preferenceHelper].userIdentity forKey:@"developer_identity"];
        [dictionary bnc_safeSetObject:[BNCPreferenceHelper preferenceHelper].deviceFingerprintID forKey:@"device_fingerprint_id"];

        [dictionary bnc_safeSetObject:self.applicationVersion forKey:@"app_version"];

        [dictionary bnc_safeSetObject:self.pluginName forKey:@"plugin_name"];
        [dictionary bnc_safeSetObject:self.pluginVersion forKey:@"plugin_version"];
        dictionary[@"sdk_version"] = BNC_SDK_VERSION;
        dictionary[@"sdk"] = @"ios";
    }

    return dictionary;
}

@end
