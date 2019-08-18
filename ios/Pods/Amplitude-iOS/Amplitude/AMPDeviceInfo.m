//
//  AMPDeviceInfo.m

#import <Foundation/Foundation.h>
#import "AMPARCMacros.h"
#import "AMPDeviceInfo.h"
#import "AMPUtils.h"
#import "AMPConstants.h"
#import <UIKit/UIKit.h>
#import <sys/sysctl.h>

#include <sys/types.h>

@interface AMPDeviceInfo ()
@end

@implementation AMPDeviceInfo {
    NSObject* networkInfo;
}

@synthesize appVersion = _appVersion;
@synthesize osVersion = _osVersion;
@synthesize model = _model;
@synthesize carrier = _carrier;
@synthesize country = _country;
@synthesize language = _language;
@synthesize advertiserID = _advertiserID;
@synthesize vendorID = _vendorID;




-(id) init {
    self = [super init];
    return self;
}

- (void) dealloc {
    SAFE_ARC_RELEASE(_appVersion);
    SAFE_ARC_RELEASE(_osVersion);
    SAFE_ARC_RELEASE(_model);
    SAFE_ARC_RELEASE(_carrier);
    SAFE_ARC_RELEASE(_country);
    SAFE_ARC_RELEASE(_language);
    SAFE_ARC_RELEASE(_advertiserID);
    SAFE_ARC_RELEASE(_vendorID);
    SAFE_ARC_SUPER_DEALLOC();
}

-(NSString*) appVersion {
    if (!_appVersion) {
        _appVersion = SAFE_ARC_RETAIN([[[NSBundle mainBundle] infoDictionary] valueForKey:@"CFBundleShortVersionString"]);
    }
    return _appVersion;
}

-(NSString*) osName {
    return kAMPOSName;
}

-(NSString*) osVersion {
    if (!_osVersion) {
        _osVersion = SAFE_ARC_RETAIN([[UIDevice currentDevice] systemVersion]);
    }
    return _osVersion;
}

-(NSString*) manufacturer {
    return @"Apple";
}

-(NSString*) model {
    if (!_model) {
        _model = SAFE_ARC_RETAIN([AMPDeviceInfo getPhoneModel]);
    }
    return _model;
}

-(NSString*) carrier {
    if (!_carrier) {
        @try {
            Class CTTelephonyNetworkInfo = NSClassFromString(@"CTTelephonyNetworkInfo");
            SEL subscriberCellularProvider = NSSelectorFromString(@"subscriberCellularProvider");
            SEL carrierName = NSSelectorFromString(@"carrierName");
            if (CTTelephonyNetworkInfo && subscriberCellularProvider && carrierName) {
                networkInfo = SAFE_ARC_RETAIN([[NSClassFromString(@"CTTelephonyNetworkInfo") alloc] init]);
                id carrier = nil;
                id (*imp1)(id, SEL) = (id (*)(id, SEL))[networkInfo methodForSelector:subscriberCellularProvider];
                if (imp1) {
                    carrier = imp1(networkInfo, subscriberCellularProvider);
                }
                NSString* (*imp2)(id, SEL) = (NSString* (*)(id, SEL))[carrier methodForSelector:carrierName];
                if (imp2) {
                    _carrier = SAFE_ARC_RETAIN(imp2(carrier, carrierName));
                }
            }
            else {
                _carrier = SAFE_ARC_RETAIN(@"Unknown");
            }
        }
        @catch (NSException *exception) {
            _carrier = SAFE_ARC_RETAIN(@"Unknown");
        }
    }
    return _carrier;
}

-(NSString*) country {
    if (!_country) {
        _country = SAFE_ARC_RETAIN([[NSLocale localeWithLocaleIdentifier:@"en_US"] displayNameForKey:
            NSLocaleCountryCode value:
            [[NSLocale currentLocale] objectForKey:NSLocaleCountryCode]]);
    }
    return _country;
}

-(NSString*) language {
    if (!_language) {
        _language = SAFE_ARC_RETAIN([[NSLocale localeWithLocaleIdentifier:@"en_US"] displayNameForKey:
            NSLocaleLanguageCode value:[[NSLocale preferredLanguages] objectAtIndex:0]]);
    }
    return _language;
}

-(NSString*) advertiserID {
    if (!_advertiserID) {
        if ([[[UIDevice currentDevice] systemVersion] floatValue] >= (float) 6.0) {
            NSString *advertiserId = [AMPDeviceInfo getAdvertiserID:5];
            if (advertiserId != nil &&
                ![advertiserId isEqualToString:@"00000000-0000-0000-0000-000000000000"]) {
                _advertiserID = SAFE_ARC_RETAIN(advertiserId);
            }
        }
    }
    return _advertiserID;
}

-(NSString*) vendorID {
    if (!_vendorID) {
        if ([[[UIDevice currentDevice] systemVersion] floatValue] >= (float) 6.0) {
            NSString *identifierForVendor = [AMPDeviceInfo getVendorID:5];
            if (identifierForVendor != nil &&
                ![identifierForVendor isEqualToString:@"00000000-0000-0000-0000-000000000000"]) {
                _vendorID = SAFE_ARC_RETAIN(identifierForVendor);
            }
        }
    }
    return _vendorID;
}

+ (NSString*)getAdvertiserID:(int) maxAttempts
{
    Class ASIdentifierManager = NSClassFromString(@"ASIdentifierManager");
    SEL sharedManager = NSSelectorFromString(@"sharedManager");
    SEL advertisingIdentifier = NSSelectorFromString(@"advertisingIdentifier");
    if (ASIdentifierManager && sharedManager && advertisingIdentifier) {
        id (*imp1)(id, SEL) = (id (*)(id, SEL))[ASIdentifierManager methodForSelector:sharedManager];
        id manager = nil;
        NSUUID *adid = nil;
        NSString *identifier = nil;
        if (imp1) {
            manager = imp1(ASIdentifierManager, sharedManager);
        }
        NSUUID* (*imp2)(id, SEL) = (NSUUID* (*)(id, SEL))[manager methodForSelector:advertisingIdentifier];
        if (imp2) {
            adid = imp2(manager, advertisingIdentifier);
        }
        if (adid) {
            identifier = [adid UUIDString];
        }
        if (identifier == nil && maxAttempts > 0) {
            // Try again every 5 seconds
            [NSThread sleepForTimeInterval:5.0];
            return [AMPDeviceInfo getAdvertiserID:maxAttempts - 1];
        } else {
            return identifier;
        }
    } else {
        return nil;
    }
}

+ (NSString*)getVendorID:(int) maxAttempts
{
    NSString *identifier = [[[UIDevice currentDevice] identifierForVendor] UUIDString];
    if (identifier == nil && maxAttempts > 0) {
        // Try again every 5 seconds
        [NSThread sleepForTimeInterval:5.0];
        return [AMPDeviceInfo getVendorID:maxAttempts - 1];
    } else {
        return identifier;
    }
}

+ (NSString*)generateUUID
{
    // Add "R" at the end of the ID to distinguish it from advertiserId
    NSString *result = [[AMPUtils generateUUID] stringByAppendingString:@"R"];
    return result;
}

+ (NSString*)getPlatformString
{
    size_t size;
    sysctlbyname("hw.machine", NULL, &size, NULL, 0);
    char *machine = malloc(size);
    sysctlbyname("hw.machine", machine, &size, NULL, 0);
    NSString *platform = [NSString stringWithUTF8String:machine];
    free(machine);
    return platform;
}

+ (NSString*)getPhoneModel{
    NSString *platform = [self getPlatformString];
    if ([platform isEqualToString:@"iPhone1,1"])    return @"iPhone 1";
    if ([platform isEqualToString:@"iPhone1,2"])    return @"iPhone 3G";
    if ([platform isEqualToString:@"iPhone2,1"])    return @"iPhone 3GS";
    if ([platform isEqualToString:@"iPhone3,1"])    return @"iPhone 4";
    if ([platform isEqualToString:@"iPhone3,2"])    return @"iPhone 4";
    if ([platform isEqualToString:@"iPhone3,3"])    return @"iPhone 4";
    if ([platform isEqualToString:@"iPhone4,1"])    return @"iPhone 4S";
    if ([platform isEqualToString:@"iPhone5,1"])    return @"iPhone 5";
    if ([platform isEqualToString:@"iPhone5,2"])    return @"iPhone 5";
    if ([platform isEqualToString:@"iPhone5,3"])    return @"iPhone 5c";
    if ([platform isEqualToString:@"iPhone5,4"])    return @"iPhone 5c";
    if ([platform isEqualToString:@"iPhone6,1"])    return @"iPhone 5s";
    if ([platform isEqualToString:@"iPhone6,2"])    return @"iPhone 5s";
    if ([platform isEqualToString:@"iPhone7,1"])    return @"iPhone 6 Plus";
    if ([platform isEqualToString:@"iPhone7,2"])    return @"iPhone 6";
    if ([platform isEqualToString:@"iPhone8,1"])    return @"iPhone 6s";
    if ([platform isEqualToString:@"iPhone8,2"])    return @"iPhone 6s Plus";
    if ([platform isEqualToString:@"iPhone8,4"])    return @"iPhone SE";
    if ([platform isEqualToString:@"iPhone9,1"])    return @"iPhone 7";
    if ([platform isEqualToString:@"iPhone9,2"])    return @"iPhone 7 Plus";
    if ([platform isEqualToString:@"iPhone9,3"])    return @"iPhone 7";
    if ([platform isEqualToString:@"iPhone9,4"])    return @"iPhone 7 Plus";
    if ([platform isEqualToString:@"iPod1,1"])      return @"iPod Touch 1G";
    if ([platform isEqualToString:@"iPod2,1"])      return @"iPod Touch 2G";
    if ([platform isEqualToString:@"iPod3,1"])      return @"iPod Touch 3G";
    if ([platform isEqualToString:@"iPod4,1"])      return @"iPod Touch 4G";
    if ([platform isEqualToString:@"iPod5,1"])      return @"iPod Touch 5G";
    if ([platform isEqualToString:@"iPod7,1"])      return @"iPod Touch 6G";
    if ([platform isEqualToString:@"iPad1,1"])      return @"iPad 1";
    if ([platform isEqualToString:@"iPad2,1"])      return @"iPad 2";
    if ([platform isEqualToString:@"iPad2,2"])      return @"iPad 2";
    if ([platform isEqualToString:@"iPad2,3"])      return @"iPad 2";
    if ([platform isEqualToString:@"iPad2,4"])      return @"iPad 2";
    if ([platform isEqualToString:@"iPad2,5"])      return @"iPad Mini";
    if ([platform isEqualToString:@"iPad2,6"])      return @"iPad Mini";
    if ([platform isEqualToString:@"iPad2,7"])      return @"iPad Mini";
    if ([platform isEqualToString:@"iPad4,4"])      return @"iPad Mini 2";
    if ([platform isEqualToString:@"iPad4,5"])      return @"iPad Mini 2";
    if ([platform isEqualToString:@"iPad4,6"])      return @"iPad Mini 2";
    if ([platform isEqualToString:@"iPad4,7"])      return @"iPad Mini 3";
    if ([platform isEqualToString:@"iPad4,8"])      return @"iPad Mini 3";
    if ([platform isEqualToString:@"iPad4,9"])      return @"iPad Mini 3";
    if ([platform isEqualToString:@"iPad5,1"])      return @"iPad Mini 4";
    if ([platform isEqualToString:@"iPad5,2"])      return @"iPad Mini 4";
    if ([platform isEqualToString:@"iPad3,1"])      return @"iPad 3";
    if ([platform isEqualToString:@"iPad3,2"])      return @"iPad 3";
    if ([platform isEqualToString:@"iPad3,3"])      return @"iPad 3";
    if ([platform isEqualToString:@"iPad3,4"])      return @"iPad 4";
    if ([platform isEqualToString:@"iPad3,5"])      return @"iPad 4";
    if ([platform isEqualToString:@"iPad3,6"])      return @"iPad 4";
    if ([platform isEqualToString:@"iPad4,1"])      return @"iPad Air";
    if ([platform isEqualToString:@"iPad4,2"])      return @"iPad Air";
    if ([platform isEqualToString:@"iPad4,3"])      return @"iPad Air";
    if ([platform isEqualToString:@"iPad5,3"])      return @"iPad Air 2";
    if ([platform isEqualToString:@"iPad5,4"])      return @"iPad Air 2";
    if ([platform isEqualToString:@"iPad6,3"])      return @"iPad Pro";
    if ([platform isEqualToString:@"iPad6,4"])      return @"iPad Pro";
    if ([platform isEqualToString:@"iPad6,7"])      return @"iPad Pro";
    if ([platform isEqualToString:@"iPad6,8"])      return @"iPad Pro";
    if ([platform isEqualToString:@"i386"])         return @"Simulator";
    if ([platform isEqualToString:@"x86_64"])       return @"Simulator";
    return platform;
}
@end
