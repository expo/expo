//
//  AMPTrackingOptions.m
//  Amplitude
//
//  Created by Daniel Jih on 7/20/18.
//  Copyright © 2018 Amplitude. All rights reserved.
//

#ifndef AMPLITUDE_DEBUG
#define AMPLITUDE_DEBUG 0
#endif

#ifndef AMPLITUDE_LOG
#if AMPLITUDE_DEBUG
#   define AMPLITUDE_LOG(fmt, ...) NSLog(fmt, ##__VA_ARGS__)
#else
#   define AMPLITUDE_LOG(...)
#endif
#endif

#import <Foundation/Foundation.h>
#import "AMPTrackingOptions.h"
#import "AMPARCMacros.h"
#import "AMPConstants.h"

@interface AMPTrackingOptions()
@end

@implementation AMPTrackingOptions
{
    NSMutableSet *_disabledFields;
}

- (id)init
{
    if ((self = [super init])) {
        _disabledFields = [[NSMutableSet alloc] init];
    }
    return self;
}

+ (instancetype)options
{
    return SAFE_ARC_AUTORELEASE([[self alloc] init]);
}

- (void)dealloc
{
    SAFE_ARC_RELEASE(_disabledFields);
    SAFE_ARC_SUPER_DEALLOC();
}

- (AMPTrackingOptions*)disableCarrier
{
    [self disableTrackingField:AMP_TRACKING_OPTION_CARRIER];
    return self;
}

- (BOOL)shouldTrackCarrier
{
    return [self shouldTrackField:AMP_TRACKING_OPTION_CARRIER];
}

- (AMPTrackingOptions*)disableCity
{
    [self disableTrackingField:AMP_TRACKING_OPTION_CITY];
    return self;
}

- (BOOL)shouldTrackCity
{
    return [self shouldTrackField:AMP_TRACKING_OPTION_CITY];
}

- (AMPTrackingOptions*)disableCountry
{
    [self disableTrackingField:AMP_TRACKING_OPTION_COUNTRY];
    return self;
}

- (BOOL)shouldTrackCountry
{
    return [self shouldTrackField:AMP_TRACKING_OPTION_COUNTRY];
}

- (AMPTrackingOptions*)disableDeviceManufacturer
{
    [self disableTrackingField:AMP_TRACKING_OPTION_DEVICE_MANUFACTURER];
    return self;
}

- (BOOL)shouldTrackDeviceManufacturer
{
    return [self shouldTrackField:AMP_TRACKING_OPTION_DEVICE_MANUFACTURER];
}

- (AMPTrackingOptions*)disableDeviceModel
{
    [self disableTrackingField:AMP_TRACKING_OPTION_DEVICE_MODEL];
    return self;
}

- (BOOL)shouldTrackDeviceModel
{
    return [self shouldTrackField:AMP_TRACKING_OPTION_DEVICE_MODEL];
}

- (AMPTrackingOptions*)disableDMA
{
    [self disableTrackingField:AMP_TRACKING_OPTION_DMA];
    return self;
}

- (BOOL)shouldTrackDMA
{
    return [self shouldTrackField:AMP_TRACKING_OPTION_DMA];
}

- (AMPTrackingOptions*)disableIDFA
{
    [self disableTrackingField:AMP_TRACKING_OPTION_IDFA];
    return self;
}

- (BOOL)shouldTrackIDFA
{
    return [self shouldTrackField:AMP_TRACKING_OPTION_IDFA];
}

- (AMPTrackingOptions*)disableIDFV
{
    [self disableTrackingField:AMP_TRACKING_OPTION_IDFV];
    return self;
}

- (BOOL)shouldTrackIDFV
{
    return [self shouldTrackField:AMP_TRACKING_OPTION_IDFV];
}

- (AMPTrackingOptions*)disableIPAddress
{
    [self disableTrackingField:AMP_TRACKING_OPTION_IP_ADDRESS];
    return self;
}

- (BOOL)shouldTrackIPAddress
{
    return [self shouldTrackField:AMP_TRACKING_OPTION_IP_ADDRESS];
}

- (AMPTrackingOptions*)disableLanguage
{
    [self disableTrackingField:AMP_TRACKING_OPTION_LANGUAGE];
    return self;
}

- (BOOL)shouldTrackLanguage
{
    return [self shouldTrackField:AMP_TRACKING_OPTION_LANGUAGE];
}

- (AMPTrackingOptions*)disableLatLng
{
    [self disableTrackingField:AMP_TRACKING_OPTION_LAT_LNG];
    return self;
}

- (BOOL)shouldTrackLatLng
{
    return [self shouldTrackField:AMP_TRACKING_OPTION_LAT_LNG];
}

- (AMPTrackingOptions*)disableOSName
{
    [self disableTrackingField:AMP_TRACKING_OPTION_OS_NAME];
    return self;
}

- (BOOL)shouldTrackOSName
{
    return [self shouldTrackField:AMP_TRACKING_OPTION_OS_NAME];
}

- (AMPTrackingOptions*)disableOSVersion
{
    [self disableTrackingField:AMP_TRACKING_OPTION_OS_VERSION];
    return self;
}

- (BOOL)shouldTrackOSVersion
{
    return [self shouldTrackField:AMP_TRACKING_OPTION_OS_VERSION];
}

- (AMPTrackingOptions*)disablePlatform
{
    [self disableTrackingField:AMP_TRACKING_OPTION_PLATFORM];
    return self;
}

- (BOOL)shouldTrackPlatform
{
    return [self shouldTrackField:AMP_TRACKING_OPTION_PLATFORM];
}

- (AMPTrackingOptions*)disableRegion
{
    [self disableTrackingField:AMP_TRACKING_OPTION_REGION];
    return self;
}

- (BOOL)shouldTrackRegion
{
    return [self shouldTrackField:AMP_TRACKING_OPTION_REGION];
}

- (AMPTrackingOptions*)disableVersionName
{
    [self disableTrackingField:AMP_TRACKING_OPTION_VERSION_NAME];
    return self;
}

- (BOOL)shouldTrackVersionName
{
    return [self shouldTrackField:AMP_TRACKING_OPTION_VERSION_NAME];
}

- (void) disableTrackingField:(NSString*)field
{
    [_disabledFields addObject:field];
}

- (BOOL) shouldTrackField:(NSString*)field
{
    return ![_disabledFields containsObject:field];
}

- (NSMutableDictionary*) getApiPropertiesTrackingOption {
    NSMutableDictionary *apiPropertiesTrackingOptions = [[NSMutableDictionary alloc] init];
    if ([_disabledFields count] == 0) {
        return SAFE_ARC_AUTORELEASE(apiPropertiesTrackingOptions);
    }

    for (id key in @[AMP_TRACKING_OPTION_CITY, AMP_TRACKING_OPTION_COUNTRY, AMP_TRACKING_OPTION_DMA, AMP_TRACKING_OPTION_IP_ADDRESS, AMP_TRACKING_OPTION_LAT_LNG, AMP_TRACKING_OPTION_REGION]) {
        if ([_disabledFields containsObject:key]) {
            [apiPropertiesTrackingOptions setObject:[NSNumber numberWithBool:NO] forKey:key];
        }
    }

    return SAFE_ARC_AUTORELEASE(apiPropertiesTrackingOptions);
}

@end
