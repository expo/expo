// Copyright 2016-present 650 Industries. All rights reserved.

#import "EXLocation.h"

#import <CoreLocation/CLLocationManager.h>
#import <CoreLocation/CLLocationManagerDelegate.h>

#import "RCTConvert.h"
#import "RCTEventDispatcher.h"
#import "RCTLog.h"

NS_ASSUME_NONNULL_BEGIN

NSString * const EXLocationChangedEventName = @"Exponent.locationChanged";

@interface EXLocationDelegate : NSObject <CLLocationManagerDelegate>

@property (nonatomic, strong) NSNumber *watchId;
@property (nonatomic, strong) CLLocationManager *locMgr;
@property (nonatomic, strong) void (^onUpdateLocations)(NSArray<CLLocation *> *locations);
@property (nonatomic, strong) void (^onError)(NSError *error);

@end

@implementation EXLocationDelegate

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


@interface EXLocation ()

@property (nonatomic, strong) NSMutableDictionary<NSNumber *, EXLocationDelegate*> *delegates;

@end

@implementation EXLocation

RCT_EXPORT_MODULE(ExponentLocation)

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
  return @[EXLocationChangedEventName];
}


RCT_REMAP_METHOD(getCurrentPositionAsync,
                 options:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  resolve(@{});
}

RCT_REMAP_METHOD(watchPositionImplAsync,
                 watchId:(nonnull NSNumber *)watchId
                 options:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  if (![CLLocationManager locationServicesEnabled]) {
    reject(@"E_LOCATION_SERVICES_DISABLED", @"Location services are disabled", nil);
    return;
  }

  CLLocationManager *locMgr = [[CLLocationManager alloc] init];
  if (!([CLLocationManager authorizationStatus] == kCLAuthorizationStatusAuthorizedAlways || [CLLocationManager authorizationStatus] == kCLAuthorizationStatusAuthorizedWhenInUse)) {
    reject(@"E_LOCATION_UNAUTHORIZED", @"Not authorized to use location services", nil);
    return;
  }

  locMgr.distanceFilter = options[@"distanceInterval"] ? [RCTConvert double:options[@"distanceInterval"]] ?: kCLDistanceFilterNone : kCLLocationAccuracyHundredMeters;
  locMgr.desiredAccuracy = [RCTConvert BOOL:options[@"enableHighAccuracy"]] ? kCLLocationAccuracyBest : kCLLocationAccuracyHundredMeters;

  __weak typeof(self) weakSelf = self;
  EXLocationDelegate *delegate = [[EXLocationDelegate alloc] initWithId:watchId withLocMgr:locMgr onUpdateLocations:^(NSArray<CLLocation *> *locations) {
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
      [weakSelf sendEventWithName:EXLocationChangedEventName body:body];
    }
  } onError:^(NSError *error) {
    // TODO: report errors
    // (ben) error could be (among other things):
    //   - kCLErrorDenied - we should use the same UNAUTHORIZED behavior as elsewhere
    //   - kCLErrorLocationUnknown - we can actually ignore this error and keep tracking
    //     location (I think -- my knowledge might be a few months out of date)
  }];
  _delegates[delegate.watchId] = delegate;
  locMgr.delegate = delegate;
  [locMgr startUpdatingLocation];
  resolve(nil);
}

RCT_REMAP_METHOD(removeWatchAsync,
                 watchId:(nonnull NSNumber *)watchId
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  EXLocationDelegate *delegate = _delegates[watchId];
  if (delegate) {
    [delegate.locMgr stopUpdatingLocation];
    delegate.locMgr.delegate = nil;
    [_delegates removeObjectForKey:watchId];
  }
}

@end

NS_ASSUME_NONNULL_END
