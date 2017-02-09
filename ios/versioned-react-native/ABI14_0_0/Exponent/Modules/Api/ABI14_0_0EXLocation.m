// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI14_0_0EXLocation.h"

#import <CoreLocation/CLLocationManager.h>
#import <CoreLocation/CLLocationManagerDelegate.h>

#import <ReactABI14_0_0/ABI14_0_0RCTConvert.h>
#import <ReactABI14_0_0/ABI14_0_0RCTEventDispatcher.h>
#import <ReactABI14_0_0/ABI14_0_0RCTLog.h>

NS_ASSUME_NONNULL_BEGIN

NSString * const ABI14_0_0EXLocationChangedEventName = @"Exponent.locationChanged";

@interface ABI14_0_0EXLocationDelegate : NSObject <CLLocationManagerDelegate>

@property (nonatomic, strong) NSNumber *watchId;
@property (nonatomic, strong) CLLocationManager *locMgr;
@property (nonatomic, strong) void (^onUpdateLocations)(NSArray<CLLocation *> *locations);
@property (nonatomic, strong) void (^onError)(NSError *error);

@end

@implementation ABI14_0_0EXLocationDelegate

- (instancetype)initWithId:(NSNumber *)watchId
                withLocMgr:(CLLocationManager *)locMgr
         onUpdateLocations:(nonnull void (^)(NSArray<CLLocation *> *locations))onUpdateLocations
                   onError:(nonnull void (^)(NSError *error))onError;
{
  if ((self = [super init])) {
    _watchId = watchId;
    _locMgr = locMgr;
    _onUpdateLocations = onUpdateLocations;
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

// Delegate method called by CLLocationManager
- (void)locationManager:(CLLocationManager *)manager didFailWithError:(nonnull NSError *)error
{
  if (_onError) {
    _onError(error);
  }
}

@end


@interface ABI14_0_0EXLocation ()

@property (nonatomic, strong) NSMutableDictionary<NSNumber *, ABI14_0_0EXLocationDelegate*> *delegates;

@end

@implementation ABI14_0_0EXLocation

ABI14_0_0RCT_EXPORT_MODULE(ExponentLocation)

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
  return @[ABI14_0_0EXLocationChangedEventName];
}


ABI14_0_0RCT_REMAP_METHOD(getCurrentPositionAsync,
                 options:(NSDictionary *)options
                 resolver:(ABI14_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI14_0_0RCTPromiseRejectBlock)reject)
{
  resolve(@{});
}

ABI14_0_0RCT_REMAP_METHOD(watchPositionImplAsync,
                 watchId:(nonnull NSNumber *)watchId
                 options:(NSDictionary *)options
                 resolver:(ABI14_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI14_0_0RCTPromiseRejectBlock)reject)
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
    
    locMgr.distanceFilter = options[@"distanceInterval"] ? [ABI14_0_0RCTConvert double:options[@"distanceInterval"]] ?: kCLDistanceFilterNone : kCLLocationAccuracyHundredMeters;
    locMgr.desiredAccuracy = [ABI14_0_0RCTConvert BOOL:options[@"enableHighAccuracy"]] ? kCLLocationAccuracyBest : kCLLocationAccuracyHundredMeters;
    
    ABI14_0_0EXLocationDelegate *delegate = [[ABI14_0_0EXLocationDelegate alloc] initWithId:watchId withLocMgr:locMgr onUpdateLocations:^(NSArray<CLLocation *> *locations) {
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
        [weakSelf sendEventWithName:ABI14_0_0EXLocationChangedEventName body:body];
      }
    } onError:^(NSError *error) {
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

ABI14_0_0RCT_REMAP_METHOD(removeWatchAsync,
                 watchId:(nonnull NSNumber *)watchId
                 resolver:(ABI14_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI14_0_0RCTPromiseRejectBlock)reject)
{
  ABI14_0_0EXLocationDelegate *delegate = _delegates[watchId];
  if (delegate) {
    __weak typeof(self) weakSelf = self;
    dispatch_async(dispatch_get_main_queue(), ^{
      [delegate.locMgr stopUpdatingLocation];
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
