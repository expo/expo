// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI18_0_0EXLocation.h"

#import <CoreLocation/CLLocationManager.h>
#import <CoreLocation/CLLocationManagerDelegate.h>
#import <CoreLocation/CLHeading.h>

#import <ReactABI18_0_0/ABI18_0_0RCTConvert.h>
#import <ReactABI18_0_0/ABI18_0_0RCTEventDispatcher.h>
#import <ReactABI18_0_0/ABI18_0_0RCTLog.h>

NS_ASSUME_NONNULL_BEGIN

NSString * const ABI18_0_0EXLocationChangedEventName = @"Exponent.locationChanged";
NSString * const ABI18_0_0EXHeadingChangedEventName = @"Exponent.headingChanged";

@interface ABI18_0_0EXLocationDelegate : NSObject <CLLocationManagerDelegate>

@property (nonatomic, strong) NSNumber *watchId;
@property (nonatomic, strong) CLLocationManager *locMgr;
@property (nonatomic, strong) void (^onUpdateLocations)(NSArray<CLLocation *> *locations);
@property (nonatomic, strong) void (^onUpdateHeadings)(CLHeading *newHeading);
@property (nonatomic, strong) void (^onError)(NSError *error);

@end

@implementation ABI18_0_0EXLocationDelegate

- (instancetype)initWithId:(NSNumber *)watchId
                withLocMgr:(CLLocationManager *)locMgr
         onUpdateLocations:(void (^)(NSArray<CLLocation *> *locations))onUpdateLocations
          onUpdateHeadings:(void (^)(CLHeading *newHeading))onUpdateHeadings
                   onError:(nonnull void (^)(NSError *error))onError;
{
  if ((self = [super init])) {
    _watchId = watchId;
    _locMgr = locMgr;
    _onUpdateLocations = onUpdateLocations;
    _onUpdateHeadings = onUpdateHeadings;
    _onError = onError;
  }
  return self;
}

// Delegate method called by CLLocationManager
- (void)locationManager:(CLLocationManager *)manager didUpdateLocations:(NSArray<CLLocation *> *)locations
{
  if (_onUpdateLocations) {
    _onUpdateLocations(locations);
  }
}

- (void)locationManager:(CLLocationManager *)manager didUpdateHeading:(CLHeading *)newHeading
{
  if (_onUpdateHeadings) {
    _onUpdateHeadings(newHeading);
  }
}

// Delegate method called by CLLocationManager
- (void)locationManager:(CLLocationManager *)manager didFailWithError:(nonnull NSError *)error
{
  if (_onError) {
    _onError(error);
  }
}

@end


@interface ABI18_0_0EXLocation ()

@property (nonatomic, strong) NSMutableDictionary<NSNumber *, ABI18_0_0EXLocationDelegate*> *delegates;

@end

@implementation ABI18_0_0EXLocation

ABI18_0_0RCT_EXPORT_MODULE(ExponentLocation)

- (instancetype)init {
  if ((self = [super init])) {
    _delegates = [NSMutableDictionary dictionary];
  }
  return self;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[ABI18_0_0EXLocationChangedEventName, ABI18_0_0EXHeadingChangedEventName];
}

ABI18_0_0RCT_REMAP_METHOD(getProviderStatusAsync,
                 resolver:(ABI18_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI18_0_0RCTPromiseRejectBlock)reject)
{
  resolve(@{
    @"locationServicesEnabled": @([CLLocationManager locationServicesEnabled]),
  });
}


ABI18_0_0RCT_REMAP_METHOD(getCurrentPositionAsync,
                 options:(NSDictionary *)options
                 resolver:(ABI18_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI18_0_0RCTPromiseRejectBlock)reject)
{
  resolve(@{});
}

ABI18_0_0RCT_REMAP_METHOD(watchPositionImplAsync,
                 watchId:(nonnull NSNumber *)watchId
                 options:(NSDictionary *)options
                 resolver:(ABI18_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI18_0_0RCTPromiseRejectBlock)reject)
{
  if (![CLLocationManager locationServicesEnabled]) {
    reject(@"E_LOCATION_SERVICES_DISABLED", @"Location services are disabled", nil);
    return;
  }
  if (!([CLLocationManager authorizationStatus] == kCLAuthorizationStatusAuthorizedAlways || [CLLocationManager authorizationStatus] == kCLAuthorizationStatusAuthorizedWhenInUse)) {
    reject(@"E_LOCATION_UNAUTHORIZED", @"Not authorized to use location services", nil);
    return;
  }
  
  __weak typeof(self) weakSelf = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    CLLocationManager *locMgr = [[CLLocationManager alloc] init];
    
    locMgr.distanceFilter = options[@"distanceInterval"] ? [ABI18_0_0RCTConvert double:options[@"distanceInterval"]] ?: kCLDistanceFilterNone : kCLLocationAccuracyHundredMeters;
    locMgr.desiredAccuracy = [ABI18_0_0RCTConvert BOOL:options[@"enableHighAccuracy"]] ? kCLLocationAccuracyBest : kCLLocationAccuracyHundredMeters;
    
    ABI18_0_0EXLocationDelegate *delegate = [[ABI18_0_0EXLocationDelegate alloc] initWithId:watchId withLocMgr:locMgr onUpdateLocations:^(NSArray<CLLocation *> *locations) {
      if (locations.lastObject) {
        CLLocation *loc = locations.lastObject;
        NSDictionary *body = @{
                               @"watchId": watchId,
                               @"location": @{
                                   @"coords": @{
                                       @"latitude": @(loc.coordinate.latitude),
                                       @"longitude": @(loc.coordinate.longitude),
                                       @"altitude": @(loc.altitude),
                                       @"accuracy": @(loc.horizontalAccuracy),
                                       @"altitudeAccuracy": @(loc.verticalAccuracy),
                                       @"heading": @(loc.course),
                                       @"speed": @(loc.speed),
                                       },
                                   @"timestamp": @([loc.timestamp timeIntervalSince1970] * 1000),
                                   },
                               };
        [weakSelf sendEventWithName:ABI18_0_0EXLocationChangedEventName body:body];
      }
    } onUpdateHeadings: nil onError:^(NSError *error) {
      // TODO: report errors
      // (ben) error could be (among other things):
      //   - kCLErrorDenied - we should use the same UNAUTHORIZED behavior as elsewhere
      //   - kCLErrorLocationUnknown - we can actually ignore this error and keep tracking
      //     location (I think -- my knowledge might be a few months out of date)
    }];
    weakSelf.delegates[delegate.watchId] = delegate;
    locMgr.delegate = delegate;
    [locMgr startUpdatingLocation];
    resolve(nil);
  });
}

// Watch method for getting compass updates
ABI18_0_0RCT_REMAP_METHOD(watchDeviceHeading,
                 watchId:(nonnull NSNumber *)watchId
                 watchDeviceHeading_resolver:(ABI18_0_0RCTPromiseResolveBlock)resolve
                 watchDeviceHeading_rejecter:(ABI18_0_0RCTPromiseRejectBlock)reject) {
  __weak typeof(self) weakSelf = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    CLLocationManager *locMgr = [[CLLocationManager alloc] init];
    locMgr.distanceFilter = kCLDistanceFilterNone;
    locMgr.desiredAccuracy = kCLLocationAccuracyBest;
    ABI18_0_0EXLocationDelegate *delegate = [[ABI18_0_0EXLocationDelegate alloc] initWithId:watchId withLocMgr:locMgr onUpdateLocations: nil onUpdateHeadings:^(CLHeading *newHeading) {
      if (newHeading) {
        NSNumber *accuracy;
        
        // Convert iOS heading accuracy to Android system
        // 3: high accuracy, 2: medium, 1: low, 0: none
        if (newHeading.headingAccuracy > 50 || newHeading.headingAccuracy < 0) {
          accuracy = @(0);
        } else if (newHeading.headingAccuracy > 35) {
          accuracy = @(1);
        } else if (newHeading.headingAccuracy > 20) {
          accuracy = @(2);
        } else {
          accuracy = @(3);
        }
        NSDictionary *body = @{@"watchId": watchId,
                               @"heading": @{
                                   @"trueHeading": @(newHeading.trueHeading),
                                   @"magHeading": @(newHeading.magneticHeading),
                                   @"accuracy": accuracy,
                                   },
                               };
        [weakSelf sendEventWithName:ABI18_0_0EXHeadingChangedEventName body:body];
      }
    } onError:^(NSError *error) {
      // Error getting updates
    }];
    weakSelf.delegates[delegate.watchId] = delegate;
    locMgr.delegate = delegate;
    [locMgr startUpdatingHeading];
    resolve(nil);
  });
}

ABI18_0_0RCT_REMAP_METHOD(removeWatchAsync,
                 watchId:(nonnull NSNumber *)watchId
                 resolver:(ABI18_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI18_0_0RCTPromiseRejectBlock)reject)
{
  ABI18_0_0EXLocationDelegate *delegate = _delegates[watchId];
  if (delegate) {
    __weak typeof(self) weakSelf = self;
    dispatch_async(dispatch_get_main_queue(), ^{
      
      // Unsuscribe from both location and heading updates
      [delegate.locMgr stopUpdatingLocation];
      [delegate.locMgr stopUpdatingHeading];
      delegate.locMgr.delegate = nil;
      __strong typeof(self) strongSelf = weakSelf;
      if (strongSelf) {
        [strongSelf.delegates removeObjectForKey:watchId];
      }
    });
  }
}

@end

NS_ASSUME_NONNULL_END
