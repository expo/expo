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
#import "BNCPreferenceHelper.h"
#import "BNCUserAgentCollector.h"

#if __has_feature(modules)
@import UIKit;
#else
#import <UIKit/UIKit.h>
#endif
#import <sys/sysctl.h> // @import not available in Xcode 7
#import <net/if.h>
#import <ifaddrs.h>
#import <arpa/inet.h>
#import <netinet/in.h>

// Forward declare this for older versions of iOS
@interface NSLocale (BranchAvailability)
- (NSString*) countryCode;
- (NSString*) languageCode;
@end

#pragma mark BRNNetworkInfo

typedef NS_ENUM(NSInteger, BNCNetworkAddressType) {
    BNCNetworkAddressTypeUnknown = 0,
    BNCNetworkAddressTypeIPv4,
    BNCNetworkAddressTypeIPv6
};

@interface BNCNetworkInterface : NSObject

+ (NSArray<BNCNetworkInterface*>*) currentInterfaces;

@property (nonatomic, strong) NSString              *interfaceName;
@property (nonatomic, assign) BNCNetworkAddressType addressType;
@property (nonatomic, strong) NSString              *address;
@end

@implementation BNCNetworkInterface

+ (NSArray<BNCNetworkInterface*>*) currentInterfaces {

    struct ifaddrs *interfaces = NULL;
    NSMutableArray *currentInterfaces = [NSMutableArray arrayWithCapacity:8];

    // Retrieve the current interfaces - returns 0 on success

    if (getifaddrs(&interfaces) != 0) {
        int e = errno;
        BNCLogError(@"Can't read ip address: (%d): %s.", e, strerror(e));
        goto exit;
    }

	// Loop through linked list of interfaces --

	struct ifaddrs *interface = NULL;
	for(interface=interfaces; interface; interface=interface->ifa_next) {
        // BNCLogDebugSDK(@"Found %s: %x.", interface->ifa_name, interface->ifa_flags);

        // Check the state: IFF_RUNNING, IFF_UP, IFF_LOOPBACK, etc.
        if ((interface->ifa_flags & IFF_UP) &&
            (interface->ifa_flags & IFF_RUNNING) &&
            !(interface->ifa_flags & IFF_LOOPBACK)) {
        } else {
            continue;
        }

        // TODO: Check ifdata too.
        // struct if_data *ifdata = interface->ifa_data;

		const struct sockaddr_in *addr = (const struct sockaddr_in*)interface->ifa_addr;
		if (!addr) continue;

		BNCNetworkAddressType type = BNCNetworkAddressTypeUnknown;
		char addrBuf[ MAX(INET_ADDRSTRLEN, INET6_ADDRSTRLEN) ];

		if (addr->sin_family == AF_INET) {
			if (inet_ntop(AF_INET, &addr->sin_addr, addrBuf, INET_ADDRSTRLEN))
				type = BNCNetworkAddressTypeIPv4;
        }
		else
		if (addr->sin_family == AF_INET6) {
			const struct sockaddr_in6 *addr6 = (const struct sockaddr_in6*)interface->ifa_addr;
			if (inet_ntop(AF_INET6, &addr6->sin6_addr, addrBuf, INET6_ADDRSTRLEN))
				type = BNCNetworkAddressTypeIPv6;
        }
        else {
            continue;
        }

		NSString *name = [NSString stringWithUTF8String:interface->ifa_name];
		if (name && type != BNCNetworkAddressTypeUnknown) {
            BNCNetworkInterface *interface = [BNCNetworkInterface new];
            interface.interfaceName = name;
            interface.addressType = type;
            interface.address = [NSString stringWithUTF8String:addrBuf];
            [currentInterfaces addObject:interface];
        }
    }

exit:
    if (interfaces) freeifaddrs(interfaces);
    return currentInterfaces;
}

- (NSString*) description {
    return [NSString stringWithFormat:@"<%@ %p %@ %@>",
        NSStringFromClass(self.class),
        self,
        self.interfaceName,
        self.address
    ];
}

@end

#pragma mark - BNCDeviceInfo

@interface BNCDeviceInfo()
@end


@implementation BNCDeviceInfo {
    NSString    *_vendorId;
    NSString    *_localIPAddress;
}

+ (BNCDeviceInfo *)getInstance {
    static BNCDeviceInfo *bnc_deviceInfo = 0;
    static dispatch_once_t onceToken = 0;
    dispatch_once(&onceToken, ^{
        bnc_deviceInfo = [[BNCDeviceInfo alloc] init];
    });
    return bnc_deviceInfo;
}

- (id)init {
    self = [super init];
    if (!self) return self;

    BNCPreferenceHelper *preferenceHelper = [BNCPreferenceHelper preferenceHelper];
    BOOL isRealHardwareId;
    NSString *hardwareIdType;
    NSString *hardwareId =
        [BNCSystemObserver getUniqueHardwareId:&isRealHardwareId
            isDebug:preferenceHelper.isDebug
            andType:&hardwareIdType];
    if (hardwareId) {
        _hardwareId = hardwareId.copy;
        _isRealHardwareId = isRealHardwareId;
        _hardwareIdType = hardwareIdType.copy;
    }

    _brandName = [BNCSystemObserver getBrand].copy;
    _modelName = [BNCSystemObserver getModel].copy;
    _osName = [BNCSystemObserver getOS].copy;
    _osVersion = [BNCSystemObserver getOSVersion].copy;
    _screenWidth = [BNCSystemObserver getScreenWidth].copy;
    _screenHeight = [BNCSystemObserver getScreenHeight].copy;
    _isAdTrackingEnabled = [BNCSystemObserver adTrackingSafe];

    _country = [BNCDeviceInfo bnc_country].copy;
    _language = [BNCDeviceInfo bnc_language].copy;
    _browserUserAgent = [BNCDeviceInfo userAgentString].copy;
    _extensionType = self.class.extensionType.copy;
    _branchSDKVersion = [NSString stringWithFormat:@"ios%@", BNC_SDK_VERSION];
    _applicationVersion = [NSBundle mainBundle].infoDictionary[@"CFBundleShortVersionString"];
    if (!_applicationVersion.length)
        _applicationVersion = [NSBundle mainBundle].infoDictionary[@"CFBundleVersionKey"];
    _screenScale = [UIScreen mainScreen].scale;
    _adId = [BNCSystemObserver getAdId];

    return self;
}

+ (NSString*_Nonnull) extensionType {
    NSString *result = @"FULL_APP";
    NSString *extensionType = [NSBundle mainBundle].infoDictionary[@"NSExtension"][@"NSExtensionPointIdentifier"];
    if ([extensionType isEqualToString:@"com.apple.identitylookup.message-filter"]) {
        result = @"IMESSAGE_APP";
    }
    return result;
}

- (NSString *)vendorId {
    @synchronized (self) {
        if (_vendorId) return _vendorId;
        /*
         * https://developer.apple.com/documentation/uikit/uidevice/1620059-identifierforvendor
         * BNCSystemObserver.getVendorId is based on UIDevice.identifierForVendor. Note from the
         * docs above:
         *
         * If the value is nil, wait and get the value again later. This happens, for example,
         * after the device has been restarted but before the user has unlocked the device.
         *
         * It's not clear if that specific example scenario would apply to opening Branch links,
         * but this lazy initialization is probably safer.
         */
        _vendorId = [BNCSystemObserver getVendorId].copy;
        return _vendorId;
    }
}

- (BOOL) unidentifiedDevice {
    return (self.vendorId == nil && self.adId == nil);
}

- (NSString*) localIPAddress { // For 'local_ip' server field.
    @synchronized (self) {
        NSArray<BNCNetworkInterface*>*interfaces = [BNCNetworkInterface currentInterfaces];
        for (BNCNetworkInterface *interface in interfaces) {
            if (interface.addressType == BNCNetworkAddressTypeIPv4)
                return interface.address;
        }
        return nil;
    }
}

- (NSArray<NSString*>*) allIPAddresses {
    NSMutableArray *array = [NSMutableArray new];
    for (BNCNetworkInterface *inf in [BNCNetworkInterface currentInterfaces]) {
        [array addObject:inf.description];
    }
    return array;
}

+ (NSString*) bnc_country {

    NSString *country = nil;
    #define returnIfValidCountry() \
        if ([country isKindOfClass:[NSString class]] && country.length) { \
            return country; \
        } else { \
            country = nil; \
        }

    // Should work on iOS 10
    NSLocale *currentLocale = [NSLocale currentLocale];
    #pragma clang diagnostic push
    #pragma clang diagnostic ignored "-Wpartial-availability"
    if ([currentLocale respondsToSelector:@selector(countryCode)]) {
        country = [currentLocale countryCode];
    }
    #pragma clang diagnostic pop
    returnIfValidCountry();

    // Should work on iOS 9
    NSString *rawLanguage = [[NSLocale preferredLanguages] firstObject];
    NSDictionary *languageDictionary = [NSLocale componentsFromLocaleIdentifier:rawLanguage];
    country = [languageDictionary objectForKey:@"kCFLocaleCountryCodeKey"];
    returnIfValidCountry();

    // Should work on iOS 8 and below.
    //NSString* language = [[NSLocale preferredLanguages] firstObject];
    NSString *rawLocale = currentLocale.localeIdentifier;
    NSRange range = [rawLocale rangeOfString:@"_"];
    if (range.location != NSNotFound) {
        range = NSMakeRange(range.location+1, rawLocale.length-range.location-1);
        country = [rawLocale substringWithRange:range];
    }
    returnIfValidCountry();

    #undef returnIfValidCountry

    return nil;
}

+ (NSString*) bnc_language {

    NSString *language = nil;
    #define returnIfValidLanguage() \
        if ([language isKindOfClass:[NSString class]] && language.length) { \
            return language; \
        } else { \
            language = nil; \
        } \

    // Should work on iOS 10
    #pragma clang diagnostic push
    #pragma clang diagnostic ignored "-Wpartial-availability"
    NSLocale *currentLocale = [NSLocale currentLocale];
    if ([currentLocale respondsToSelector:@selector(languageCode)]) {
        language = [currentLocale languageCode];
    }
    #pragma clang diagnostic pop
    returnIfValidLanguage();

    // Should work on iOS 9
    NSString *rawLanguage = [[NSLocale preferredLanguages] firstObject];
    NSDictionary *languageDictionary = [NSLocale componentsFromLocaleIdentifier:rawLanguage];
    language = [languageDictionary  objectForKey:@"kCFLocaleLanguageCodeKey"];
    returnIfValidLanguage();

    // Should work on iOS 8 and below.
    language = [[NSLocale preferredLanguages] firstObject];
    returnIfValidLanguage();

    #undef returnIfValidLanguage

    return nil;
}

+ (NSString*) systemBuildVersion {
    int mib[2] = { CTL_KERN, KERN_OSVERSION };
    u_int namelen = sizeof(mib) / sizeof(mib[0]);

    //	Get the size for the buffer --

    size_t bufferSize = 0;
    sysctl(mib, namelen, NULL, &bufferSize, NULL, 0);
	if (bufferSize <= 0) return nil;

    u_char buildBuffer[bufferSize];
    int result = sysctl(mib, namelen, buildBuffer, &bufferSize, NULL, 0);

	NSString *version = nil;
    if (result >= 0) {
        version = [[NSString alloc]
            initWithBytes:buildBuffer
            length:bufferSize-1
            encoding:NSUTF8StringEncoding];
    }
    return version;
}

+ (NSString *)userAgentString {
    return [BNCUserAgentCollector instance].userAgent;
}

- (NSDictionary*) v2dictionary {
    NSMutableDictionary *dictionary = [NSMutableDictionary new];

    #define BNCFieldDefinesDictionaryFromSelf
    #include "BNCFieldDefines.h"

    addString(osName,               os);
    addString(osVersion,            os_version);
    addString(extensionType,        environment);
    addString(vendorId,             idfv);
    if ([BNCPreferenceHelper preferenceHelper].isDebug) {
        dictionary[@"unidentified_device"] = (__bridge NSNumber*) kCFBooleanTrue;
    } else {
        addString(adId,             idfa);
    }
    addString(browserUserAgent,     user_agent);
    addString(country,              country);
    addString(language,             language);
    addString(brandName,            brand);
    addString(applicationVersion,   app_version);
    addString(modelName,            model);
    addDouble(screenScale,          screen_dpi);
    addNumber(screenHeight,         screen_height);
    addNumber(screenWidth,          screen_width);
    addBoolean(unidentifiedDevice,  unidentified_device);
    addString(localIPAddress,       local_ip);

    #include "BNCFieldDefines.h"

    if (!self.isAdTrackingEnabled)
        dictionary[@"limit_ad_tracking"] = (__bridge NSNumber*) kCFBooleanTrue;

    NSString *s = nil;
    BNCPreferenceHelper *preferences = [BNCPreferenceHelper preferenceHelper];

    s = preferences.userIdentity;
    if (s.length) dictionary[@"developer_identity"] = s;

    s = preferences.deviceFingerprintID;
    if (s.length) dictionary[@"device_fingerprint_id"] = s;

    if (preferences.limitFacebookTracking)
        dictionary[@"limit_facebook_tracking"] = (__bridge NSNumber*) kCFBooleanTrue;

    dictionary[@"sdk"] = @"ios";
    dictionary[@"sdk_version"] = BNC_SDK_VERSION;

    return dictionary;
}

@end
