//
//  AMPDeviceInfo.m
//  Copyright (c) 2014 Amplitude Inc. (https://amplitude.com/)
//
//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to deal
//  in the Software without restriction, including without limitation the rights
//  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//  copies of the Software, and to permit persons to whom the Software is
//  furnished to do so, subject to the following conditions:
//
//  The above copyright notice and this permission notice shall be included in
//  all copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.
//

#import "AMPConstants.h"
#import "AMPDeviceInfo.h"
#import "AMPUtils.h"

#import <sys/sysctl.h>
#import <sys/types.h>

#if !TARGET_OS_OSX
#import <UIKit/UIKit.h>
#else
#import <Cocoa/Cocoa.h>
#import <net/if.h>
#import <net/if_dl.h>
#endif

#ifndef AMPLITUDE_LOG
#if AMPLITUDE_DEBUG
#   define AMPLITUDE_LOG(fmt, ...) NSLog(fmt, ##__VA_ARGS__)
#else
#   define AMPLITUDE_LOG(...)
#endif
#endif

@interface AMPDeviceInfo()
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

- (NSString*)appVersion {
    if (!_appVersion) {
        _appVersion = [[[NSBundle mainBundle] infoDictionary] valueForKey:@"CFBundleShortVersionString"];
    }
    return _appVersion;
}

- (NSString*)osName {
    return kAMPOSName;
}

- (NSString*)osVersion {
    if (!_osVersion) {
        #if !TARGET_OS_OSX
        _osVersion = [[UIDevice currentDevice] systemVersion];
        #else
        NSOperatingSystemVersion systemVersion = [[NSProcessInfo processInfo] operatingSystemVersion];
        _osVersion = [NSString stringWithFormat:@"%ld.%ld.%ld",
                      systemVersion.majorVersion,
                      systemVersion.minorVersion,
                      systemVersion.patchVersion];
        #endif
    }
    return _osVersion;
}

- (NSString*)manufacturer {
    return @"Apple";
}

- (NSString*)model {
    if (!_model) {
        _model = [AMPDeviceInfo getDeviceModel];
    }
    return _model;
}

- (NSString*)carrier {
    if (!_carrier) {
        Class CTTelephonyNetworkInfo = NSClassFromString(@"CTTelephonyNetworkInfo");
        SEL subscriberCellularProvider = NSSelectorFromString(@"subscriberCellularProvider");
        SEL carrierName = NSSelectorFromString(@"carrierName");
        if (CTTelephonyNetworkInfo && subscriberCellularProvider && carrierName) {
            networkInfo = [[NSClassFromString(@"CTTelephonyNetworkInfo") alloc] init];
            id carrier = nil;
            id (*imp1)(id, SEL) = (id (*)(id, SEL))[networkInfo methodForSelector:subscriberCellularProvider];
            if (imp1) {
                carrier = imp1(networkInfo, subscriberCellularProvider);
            }
            NSString* (*imp2)(id, SEL) = (NSString* (*)(id, SEL))[carrier methodForSelector:carrierName];
            if (imp2) {
                _carrier = imp2(carrier, carrierName);
            }
        }
        // unable to fetch carrier information
        if (!_carrier) {
            _carrier = @"Unknown";
        }
    }
    return _carrier;
}

- (NSString*)country {
    if (!_country) {
        _country = [[NSLocale localeWithLocaleIdentifier:@"en_US"] displayNameForKey: NSLocaleCountryCode
                                                                               value: [[NSLocale currentLocale] objectForKey:NSLocaleCountryCode]];
    }
    return _country;
}

- (NSString*)language {
    if (!_language) {
        _language = [[NSLocale localeWithLocaleIdentifier:@"en_US"] displayNameForKey: NSLocaleLanguageCode
                                                                                value: [[NSLocale preferredLanguages] objectAtIndex:0]];
    }
    return _language;
}

- (NSString*)advertiserID {
#if AMPLITUDE_IDFA_TRACKING
    if (!_advertiserID) {
#if !TARGET_OS_OSX
        if ([[[UIDevice currentDevice] systemVersion] floatValue] >= (float) 6.0) {
#endif
            NSString *advertiserId = [AMPDeviceInfo getAdvertiserID:5];
            if (advertiserId != nil &&
                ![advertiserId isEqualToString:@"00000000-0000-0000-0000-000000000000"]) {
                _advertiserID = advertiserId;
            }
        }
#if !TARGET_OS_OSX
    }
#endif
    return _advertiserID;

#else
    return nil;
#endif
}

- (NSString*)vendorID {
    if (!_vendorID) {
#if !TARGET_OS_OSX
        if ([[[UIDevice currentDevice] systemVersion] floatValue] >= 6.0) {
#endif
            NSString *identifierForVendor = [AMPDeviceInfo getVendorID:5];
            if (identifierForVendor != nil &&
                ![identifierForVendor isEqualToString:@"00000000-0000-0000-0000-000000000000"]) {
                _vendorID = identifierForVendor;
            }
        }
#if !TARGET_OS_OSX
    }
#endif
    return _vendorID;
}

+ (NSString*)getAdvertiserID:(int) maxAttempts {
#if AMPLITUDE_IDFA_TRACKING
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
    }
#endif
    return nil;
}

+ (NSString*)getVendorID:(int) maxAttempts {
#if !TARGET_OS_OSX
    NSString *identifier = [[[UIDevice currentDevice] identifierForVendor] UUIDString];
#else
    NSString *identifier = [self getMacAddress];
#endif
    if (identifier == nil && maxAttempts > 0) {
        // Try again every 5 seconds
        [NSThread sleepForTimeInterval:5.0];
        return [AMPDeviceInfo getVendorID:maxAttempts - 1];
    } else {
        return identifier;
    }
}

+ (NSString*)generateUUID {
    // Add "R" at the end of the ID to distinguish it from advertiserId
    NSString *result = [[AMPUtils generateUUID] stringByAppendingString:@"R"];
    return result;
}

+ (NSString*)getPlatformString {
#if !TARGET_OS_OSX
    const char *sysctl_name = "hw.machine";
#else
    const char *sysctl_name = "hw.model";
#endif
    size_t size;
    sysctlbyname(sysctl_name, NULL, &size, NULL, 0);
    char *machine = malloc(size);
    sysctlbyname(sysctl_name, machine, &size, NULL, 0);
    NSString *platform = [NSString stringWithUTF8String:machine];
    free(machine);
    return platform;
}

+ (NSString*)getDeviceModel {
    NSString *platform = [self getPlatformString];
    // == iPhone ==
    // iPhone 1
    if ([platform isEqualToString:@"iPhone1,1"])    return @"iPhone 1";
    // iPhone 3
    if ([platform isEqualToString:@"iPhone1,2"])    return @"iPhone 3G";
    if ([platform isEqualToString:@"iPhone2,1"])    return @"iPhone 3GS";
    // iPhone 4
    if ([platform isEqualToString:@"iPhone3,1"])    return @"iPhone 4";
    if ([platform isEqualToString:@"iPhone3,2"])    return @"iPhone 4";
    if ([platform isEqualToString:@"iPhone3,3"])    return @"iPhone 4";
    if ([platform isEqualToString:@"iPhone4,1"])    return @"iPhone 4S";
    // iPhone 5
    if ([platform isEqualToString:@"iPhone5,1"])    return @"iPhone 5";
    if ([platform isEqualToString:@"iPhone5,2"])    return @"iPhone 5";
    if ([platform isEqualToString:@"iPhone5,3"])    return @"iPhone 5c";
    if ([platform isEqualToString:@"iPhone5,4"])    return @"iPhone 5c";
    if ([platform isEqualToString:@"iPhone6,1"])    return @"iPhone 5s";
    if ([platform isEqualToString:@"iPhone6,2"])    return @"iPhone 5s";
    // iPhone 6
    if ([platform isEqualToString:@"iPhone7,1"])    return @"iPhone 6 Plus";
    if ([platform isEqualToString:@"iPhone7,2"])    return @"iPhone 6";
    if ([platform isEqualToString:@"iPhone8,1"])    return @"iPhone 6s";
    if ([platform isEqualToString:@"iPhone8,2"])    return @"iPhone 6s Plus";
    
    // iPhone 7
    if ([platform isEqualToString:@"iPhone9,1"])    return @"iPhone 7";
    if ([platform isEqualToString:@"iPhone9,2"])    return @"iPhone 7 Plus";
    if ([platform isEqualToString:@"iPhone9,3"])    return @"iPhone 7";
    if ([platform isEqualToString:@"iPhone9,4"])    return @"iPhone 7 Plus";
    // iPhone 8
    if ([platform isEqualToString:@"iPhone10,1"])    return @"iPhone 8";
    if ([platform isEqualToString:@"iPhone10,4"])    return @"iPhone 8";
    if ([platform isEqualToString:@"iPhone10,2"])    return @"iPhone 8 Plus";
    if ([platform isEqualToString:@"iPhone10,5"])    return @"iPhone 8 Plus";
    
    // iPhone X
    if ([platform isEqualToString:@"iPhone10,3"])    return @"iPhone X";
    if ([platform isEqualToString:@"iPhone10,6"])    return @"iPhone X";
    
    // iPhone XS
    if ([platform isEqualToString:@"iPhone11,2"])    return @"iPhone XS";
    if ([platform isEqualToString:@"iPhone11,6"])    return @"iPhone XS Max";
    
    // iPhone XR
    if ([platform isEqualToString:@"iPhone11,8"])    return @"iPhone XR";
    
    // iPhone 11
    if ([platform isEqualToString:@"iPhone12,1"])    return @"iPhone 11";
    if ([platform isEqualToString:@"iPhone12,3"])    return @"iPhone 11 Pro";
    if ([platform isEqualToString:@"iPhone12,5"])    return @"iPhone 11 Pro Max";
    
    // iPhone SE
    if ([platform isEqualToString:@"iPhone8,4"])    return @"iPhone SE";
    if ([platform isEqualToString:@"iPhone12,8"])    return @"iPhone SE 2";
    
    // == iPod ==
    if ([platform isEqualToString:@"iPod1,1"])      return @"iPod Touch 1G";
    if ([platform isEqualToString:@"iPod2,1"])      return @"iPod Touch 2G";
    if ([platform isEqualToString:@"iPod3,1"])      return @"iPod Touch 3G";
    if ([platform isEqualToString:@"iPod4,1"])      return @"iPod Touch 4G";
    if ([platform isEqualToString:@"iPod5,1"])      return @"iPod Touch 5G";
    if ([platform isEqualToString:@"iPod7,1"])      return @"iPod Touch 6G";
    if ([platform isEqualToString:@"iPod9,1"])      return @"iPod Touch 7G";
    
    // == iPad ==
    // iPad 1
    if ([platform isEqualToString:@"iPad1,1"])      return @"iPad 1";
    // iPad 2
    if ([platform isEqualToString:@"iPad2,1"])      return @"iPad 2";
    if ([platform isEqualToString:@"iPad2,2"])      return @"iPad 2";
    if ([platform isEqualToString:@"iPad2,3"])      return @"iPad 2";
    if ([platform isEqualToString:@"iPad2,4"])      return @"iPad 2";
    // iPad 3
    if ([platform isEqualToString:@"iPad3,1"])      return @"iPad 3";
    if ([platform isEqualToString:@"iPad3,2"])      return @"iPad 3";
    if ([platform isEqualToString:@"iPad3,3"])      return @"iPad 3";
    // iPad 4
    if ([platform isEqualToString:@"iPad3,4"])      return @"iPad 4";
    if ([platform isEqualToString:@"iPad3,5"])      return @"iPad 4";
    if ([platform isEqualToString:@"iPad3,6"])      return @"iPad 4";
    // iPad Air
    if ([platform isEqualToString:@"iPad4,1"])      return @"iPad Air";
    if ([platform isEqualToString:@"iPad4,2"])      return @"iPad Air";
    if ([platform isEqualToString:@"iPad4,3"])      return @"iPad Air";
    // iPad Air 2
    if ([platform isEqualToString:@"iPad5,3"])      return @"iPad Air 2";
    if ([platform isEqualToString:@"iPad5,4"])      return @"iPad Air 2";
    // iPad 5
    if ([platform isEqualToString:@"iPad6,11"])      return @"iPad 5";
    if ([platform isEqualToString:@"iPad6,12"])      return @"iPad 5";
    // iPad 6
    if ([platform isEqualToString:@"iPad7,5"])      return @"iPad 6";
    if ([platform isEqualToString:@"iPad7,6"])      return @"iPad 6";
    // iPad Air 3
    if ([platform isEqualToString:@"iPad11,3"])      return @"iPad Air 3";
    if ([platform isEqualToString:@"iPad11,4"])      return @"iPad Air 3";
    // iPad 7
    if ([platform isEqualToString:@"iPad7,11"])      return @"iPad 6";
    if ([platform isEqualToString:@"iPad7,12"])      return @"iPad 6";
    
    // iPad Pro
    if ([platform isEqualToString:@"iPad6,7"])      return @"iPad Pro";
    if ([platform isEqualToString:@"iPad6,8"])      return @"iPad Pro";
    if ([platform isEqualToString:@"iPad6,3"])      return @"iPad Pro";
    if ([platform isEqualToString:@"iPad6,4"])      return @"iPad Pro";
    if ([platform isEqualToString:@"iPad7,1"])      return @"iPad Pro";
    if ([platform isEqualToString:@"iPad7,2"])      return @"iPad Pro";
    if ([platform isEqualToString:@"iPad7,3"])      return @"iPad Pro";
    if ([platform isEqualToString:@"iPad7,4"])      return @"iPad Pro";
    if ([platform isEqualToString:@"iPad8,1"])      return @"iPad Pro";
    if ([platform isEqualToString:@"iPad8,2"])      return @"iPad Pro";
    if ([platform isEqualToString:@"iPad8,3"])      return @"iPad Pro";
    if ([platform isEqualToString:@"iPad8,4"])      return @"iPad Pro";
    if ([platform isEqualToString:@"iPad8,5"])      return @"iPad Pro";
    if ([platform isEqualToString:@"iPad8,6"])      return @"iPad Pro";
    if ([platform isEqualToString:@"iPad8,7"])      return @"iPad Pro";
    if ([platform isEqualToString:@"iPad8,8"])      return @"iPad Pro";
    
    // iPad Mini
    if ([platform isEqualToString:@"iPad2,5"])      return @"iPad Mini";
    if ([platform isEqualToString:@"iPad2,6"])      return @"iPad Mini";
    if ([platform isEqualToString:@"iPad2,7"])      return @"iPad Mini";
    // iPad Mini 2
    if ([platform isEqualToString:@"iPad4,4"])      return @"iPad Mini 2";
    if ([platform isEqualToString:@"iPad4,5"])      return @"iPad Mini 2";
    if ([platform isEqualToString:@"iPad4,6"])      return @"iPad Mini 2";
    // iPad Mini 3
    if ([platform isEqualToString:@"iPad4,7"])      return @"iPad Mini 3";
    if ([platform isEqualToString:@"iPad4,8"])      return @"iPad Mini 3";
    if ([platform isEqualToString:@"iPad4,9"])      return @"iPad Mini 3";
    // iPad Mini 4
    if ([platform isEqualToString:@"iPad5,1"])      return @"iPad Mini 4";
    if ([platform isEqualToString:@"iPad5,2"])      return @"iPad Mini 4";
    // iPad Mini 5
    if ([platform isEqualToString:@"iPad11,1"])      return @"iPad Mini 5";
    if ([platform isEqualToString:@"iPad11,2"])      return @"iPad Mini 5";
    
    // == Others ==
    if ([platform isEqualToString:@"i386"])         return @"Simulator";
    if ([platform isEqualToString:@"x86_64"])       return @"Simulator";
    if ([platform hasPrefix:@"MacBookAir"])         return @"MacBook Air";
    if ([platform hasPrefix:@"MacBookPro"])         return @"MacBook Pro";
    if ([platform hasPrefix:@"MacBook"])            return @"MacBook";
    if ([platform hasPrefix:@"MacPro"])             return @"Mac Pro";
    if ([platform hasPrefix:@"Macmini"])            return @"Mac Mini";
    if ([platform hasPrefix:@"iMac"])               return @"iMac";
    if ([platform hasPrefix:@"Xserve"])             return @"Xserve";
    return platform;
}

// For mac only!!!
#if TARGET_OS_OSX
+ (NSString *)getMacAddress {
    int                 mgmtInfoBase[6];
    char                *msgBuffer = NULL;
    size_t              length;
    unsigned char       macAddress[6];
    struct if_msghdr    *interfaceMsgStruct;
    struct sockaddr_dl  *socketStruct;
    NSString            *errorFlag = NULL;
    bool                msgBufferAllocated = false;

    // Setup the management Information Base (mib)
    mgmtInfoBase[0] = CTL_NET;        // Request network subsystem
    mgmtInfoBase[1] = AF_ROUTE;       // Routing table info
    mgmtInfoBase[2] = 0;
    mgmtInfoBase[3] = AF_LINK;        // Request link layer information
    mgmtInfoBase[4] = NET_RT_IFLIST;  // Request all configured interfaces

    // With all configured interfaces requested, get handle index
    if ((mgmtInfoBase[5] = if_nametoindex("en0")) == 0) {
        errorFlag = @"if_nametoindex failure";
    } else {
        // Get the size of the data available (store in len)
        if (sysctl(mgmtInfoBase, 6, NULL, &length, NULL, 0) < 0) {
            errorFlag = @"sysctl mgmtInfoBase failure";
        } else {
            // Alloc memory based on above call
            if ((msgBuffer = malloc(length)) == NULL) {
                errorFlag = @"buffer allocation failure";
            } else {
                msgBufferAllocated = true;
                // Get system information, store in buffer
                if (sysctl(mgmtInfoBase, 6, msgBuffer, &length, NULL, 0) < 0) {
                    errorFlag = @"sysctl msgBuffer failure";
                }
            }
        }
    }

    // Before going any further...
    if (errorFlag != NULL) {
        AMPLITUDE_LOG(@"Cannot detect mac address. Error: %@", errorFlag);
        if (msgBufferAllocated) {
            free(msgBuffer);
        }
        return nil;
    }

    // Map msgbuffer to interface message structure
    interfaceMsgStruct = (struct if_msghdr *) msgBuffer;

    // Map to link-level socket structure
    socketStruct = (struct sockaddr_dl *) (interfaceMsgStruct + 1);

    // Copy link layer address data in socket structure to an array
    memcpy(&macAddress, socketStruct->sdl_data + socketStruct->sdl_nlen, 6);

    // Read from char array into a string object, into traditional Mac address format
    NSString *macAddressString = [NSString stringWithFormat:@"%02X%02X%02X%02X%02X%02X",
                                  macAddress[0], macAddress[1], macAddress[2],
                                  macAddress[3], macAddress[4], macAddress[5]];

    // Release the buffer memory
    free(msgBuffer);

    return macAddressString;
}
#endif

@end
