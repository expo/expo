// Copyright 2015-present 650 Industries. All rights reserved.

#import <CoreLocation/CLHeading.h>
#import <CoreLocation/CLLocation.h>
#import <CoreLocation/CLLocationManager.h>
#import <CoreLocation/CLLocationManagerDelegate.h>

@interface EXLocationDelegate : NSObject <CLLocationManagerDelegate>

@property (nonatomic, strong) NSNumber *watchId;
@property (nonatomic, strong) CLLocationManager *locMgr;
@property (nonatomic, strong) void (^onUpdateLocations)(NSArray<CLLocation *> *locations);
@property (nonatomic, strong) void (^onUpdateHeadings)(CLHeading *newHeading);
@property (nonatomic, strong) void (^onError)(NSError *error);

- (instancetype)initWithId:(nullable NSNumber *)watchId
                withLocMgr:(CLLocationManager *)locMgr
         onUpdateLocations:(nullable void (^)(NSArray<CLLocation *> *locations))onUpdateLocations
          onUpdateHeadings:(nullable void (^)(CLHeading *newHeading))onUpdateHeadings
                   onError:(nullable void (^)(NSError *error))onError;

- (void)locationManager:(CLLocationManager *)manager didUpdateLocations:(NSArray<CLLocation *> *)locations;

- (void)locationManager:(CLLocationManager *)manager didUpdateHeading:(CLHeading *)newHeading;

- (void)locationManager:(CLLocationManager *)manager didFailWithError:(nonnull NSError *)error;

@end
