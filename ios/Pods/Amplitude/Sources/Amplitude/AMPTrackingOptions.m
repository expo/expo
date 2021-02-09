//
//  AMPTrackingOptions.m
//  Copyright (c) 2018 Amplitude Inc. (https://amplitude.com/)
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

#import "AMPTrackingOptions.h"
#import "AMPConstants.h"

@interface AMPTrackingOptions()

@property (nonatomic, strong, readwrite) NSMutableSet *disabledFields;

@end

@implementation AMPTrackingOptions

- (instancetype)init {
    if ((self = [super init])) {
        self.disabledFields = [[NSMutableSet alloc] init];
    }
    return self;
}

+ (instancetype)options {
    return [[self alloc] init];
}

- (AMPTrackingOptions*)disableCarrier {
    [self disableTrackingField:AMP_TRACKING_OPTION_CARRIER];
    return self;
}

- (BOOL)shouldTrackCarrier {
    return [self shouldTrackField:AMP_TRACKING_OPTION_CARRIER];
}

- (AMPTrackingOptions*)disableCity {
    [self disableTrackingField:AMP_TRACKING_OPTION_CITY];
    return self;
}

- (BOOL)shouldTrackCity {
    return [self shouldTrackField:AMP_TRACKING_OPTION_CITY];
}

- (AMPTrackingOptions*)disableCountry {
    [self disableTrackingField:AMP_TRACKING_OPTION_COUNTRY];
    return self;
}

- (BOOL)shouldTrackCountry {
    return [self shouldTrackField:AMP_TRACKING_OPTION_COUNTRY];
}

- (AMPTrackingOptions*)disableDeviceManufacturer {
    [self disableTrackingField:AMP_TRACKING_OPTION_DEVICE_MANUFACTURER];
    return self;
}

- (BOOL)shouldTrackDeviceManufacturer {
    return [self shouldTrackField:AMP_TRACKING_OPTION_DEVICE_MANUFACTURER];
}

- (AMPTrackingOptions*)disableDeviceModel {
    [self disableTrackingField:AMP_TRACKING_OPTION_DEVICE_MODEL];
    return self;
}

- (BOOL)shouldTrackDeviceModel {
    return [self shouldTrackField:AMP_TRACKING_OPTION_DEVICE_MODEL];
}

- (AMPTrackingOptions*)disableDMA {
    [self disableTrackingField:AMP_TRACKING_OPTION_DMA];
    return self;
}

- (BOOL)shouldTrackDMA {
    return [self shouldTrackField:AMP_TRACKING_OPTION_DMA];
}

- (AMPTrackingOptions*)disableIDFA {
    [self disableTrackingField:AMP_TRACKING_OPTION_IDFA];
    return self;
}

- (BOOL)shouldTrackIDFA {
    return [self shouldTrackField:AMP_TRACKING_OPTION_IDFA];
}

- (AMPTrackingOptions*)disableIDFV
{
    [self disableTrackingField:AMP_TRACKING_OPTION_IDFV];
    return self;
}

- (BOOL)shouldTrackIDFV {
    return [self shouldTrackField:AMP_TRACKING_OPTION_IDFV];
}

- (AMPTrackingOptions*)disableIPAddress {
    [self disableTrackingField:AMP_TRACKING_OPTION_IP_ADDRESS];
    return self;
}

- (BOOL)shouldTrackIPAddress {
    return [self shouldTrackField:AMP_TRACKING_OPTION_IP_ADDRESS];
}

- (AMPTrackingOptions*)disableLanguage
{
    [self disableTrackingField:AMP_TRACKING_OPTION_LANGUAGE];
    return self;
}

- (BOOL)shouldTrackLanguage {
    return [self shouldTrackField:AMP_TRACKING_OPTION_LANGUAGE];
}

- (AMPTrackingOptions*)disableLatLng {
    [self disableTrackingField:AMP_TRACKING_OPTION_LAT_LNG];
    return self;
}

- (BOOL)shouldTrackLatLng {
    return [self shouldTrackField:AMP_TRACKING_OPTION_LAT_LNG];
}

- (AMPTrackingOptions*)disableOSName {
    [self disableTrackingField:AMP_TRACKING_OPTION_OS_NAME];
    return self;
}

- (BOOL)shouldTrackOSName {
    return [self shouldTrackField:AMP_TRACKING_OPTION_OS_NAME];
}

- (AMPTrackingOptions*)disableOSVersion {
    [self disableTrackingField:AMP_TRACKING_OPTION_OS_VERSION];
    return self;
}

- (BOOL)shouldTrackOSVersion {
    return [self shouldTrackField:AMP_TRACKING_OPTION_OS_VERSION];
}

- (AMPTrackingOptions*)disablePlatform {
    [self disableTrackingField:AMP_TRACKING_OPTION_PLATFORM];
    return self;
}

- (BOOL)shouldTrackPlatform {
    return [self shouldTrackField:AMP_TRACKING_OPTION_PLATFORM];
}

- (AMPTrackingOptions*)disableRegion {
    [self disableTrackingField:AMP_TRACKING_OPTION_REGION];
    return self;
}

- (BOOL)shouldTrackRegion {
    return [self shouldTrackField:AMP_TRACKING_OPTION_REGION];
}

- (AMPTrackingOptions*)disableVersionName {
    [self disableTrackingField:AMP_TRACKING_OPTION_VERSION_NAME];
    return self;
}

- (BOOL)shouldTrackVersionName {
    return [self shouldTrackField:AMP_TRACKING_OPTION_VERSION_NAME];
}

- (void) disableTrackingField:(NSString*)field {
    [self.disabledFields addObject:field];
}

- (BOOL) shouldTrackField:(NSString*)field {
    return ![self.disabledFields containsObject:field];
}

- (NSMutableDictionary*) getApiPropertiesTrackingOption {
    NSMutableDictionary *apiPropertiesTrackingOptions = [[NSMutableDictionary alloc] init];
    if (self.disabledFields.count == 0) {
        return apiPropertiesTrackingOptions;
    }
    
    NSArray *serverSideOptions =  @[AMP_TRACKING_OPTION_CITY,
                                    AMP_TRACKING_OPTION_COUNTRY,
                                    AMP_TRACKING_OPTION_DMA,
                                    AMP_TRACKING_OPTION_IP_ADDRESS,
                                    AMP_TRACKING_OPTION_LAT_LNG,
                                    AMP_TRACKING_OPTION_REGION];

    for (id key in serverSideOptions) {
        if ([self.disabledFields containsObject:key]) {
            [apiPropertiesTrackingOptions setObject:[NSNumber numberWithBool:NO] forKey:key];
        }
    }

    return apiPropertiesTrackingOptions;
}

- (AMPTrackingOptions *)mergeIn: (AMPTrackingOptions *)other {
    for (NSString *field in other.disabledFields) {
        [self disableTrackingField:field];
    }
    
    return self;
}

+ (AMPTrackingOptions *)forCoppaControl {
    NSArray *coppaControlOptions = @[AMP_TRACKING_OPTION_IDFA,
                                     AMP_TRACKING_OPTION_IDFV,
                                     AMP_TRACKING_OPTION_CITY,
                                     AMP_TRACKING_OPTION_IP_ADDRESS,
                                     AMP_TRACKING_OPTION_LAT_LNG];
    
    AMPTrackingOptions *options = [[AMPTrackingOptions alloc] init];
    for (NSString *field in coppaControlOptions) {
        [options disableTrackingField:field];
    }
    return options;
}

+ (AMPTrackingOptions *)copyOf: (AMPTrackingOptions *)origin {
    AMPTrackingOptions *options = [[AMPTrackingOptions alloc] init];
    for (NSString *field in origin.disabledFields) {
        [options disableTrackingField:field];
    }
    
    return options;
}

@end
