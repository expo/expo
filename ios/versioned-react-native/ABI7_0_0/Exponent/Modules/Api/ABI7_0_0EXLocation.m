// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI7_0_0EXLocation.h"

#import <CoreLocation/CLLocationManager.h>
#import <CoreLocation/CLLocationManagerDelegate.h>

#import "ABI7_0_0RCTConvert.h"
#import "ABI7_0_0RCTEventDispatcher.h"
#import "ABI7_0_0RCTLog.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI7_0_0EXLocationDelegate : NSObject <CLLocationManagerDelegate>

@property (nonatomic, strong) NSNumber *watchId;
@property (nonatomic, strong) CLLocationManager *locMgr;
@property (nonatomic, strong) void (^onUpdateLocations)(NSArray<CLLocation *> *locations);
@property (nonatomic, strong) void (^onError)(NSError *error);

@end

@implementation ABI7_0_0EXLocationDelegate

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
  _onUpdateLocations(locations);
}

// Delegate method called by CLLocationManager
- (void)locationManager:(CLLocationManager *)manager didFailWithError:(nonnull NSError *)error
{
  _onError(error);
}

@end


@interface ABI7_0_0EXLocation ()

@property (nonatomic, strong) NSMutableDictionary<NSNumber *, ABI7_0_0EXLocationDelegate*> *delegates;

@end

@implementation ABI7_0_0EXLocation

ABI7_0_0RCT_EXPORT_MODULE(ExponentLocation)

@synthesize bridge = _bridge;

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


ABI7_0_0RCT_REMAP_METHOD(getCurrentPositionAsync,
                 options:(NSDictionary *)options
                 resolver:(ABI7_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI7_0_0RCTPromiseRejectBlock)reject)
{
  resolve(@{});
}

ABI7_0_0RCT_REMAP_METHOD(watchPositionImplAsync,
                 watchId:(nonnull NSNumber *)watchId
                 options:(NSDictionary *)options
                 resolver:(ABI7_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI7_0_0RCTPromiseRejectBlock)reject)
{
  if (![self checkInfoPlistWithRejecter:reject]) {
    return;
  }
  if (![CLLocationManager locationServicesEnabled]) {
    reject(@"E_LOCATION_SERVICES_DISABLED", @"Location services are disabled", nil);
    return;
  }

  CLLocationManager *locMgr = [[CLLocationManager alloc] init];
  if ([[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSLocationAlwaysUsageDescription"] &&
      [locMgr respondsToSelector:@selector(requestAlwaysAuthorization)]) {
    [locMgr requestAlwaysAuthorization];
  } else if ([[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSLocationWhenInUseUsageDescription"] &&
             [locMgr respondsToSelector:@selector(requestWhenInUseAuthorization)]) {
    [locMgr requestWhenInUseAuthorization];
  }
  if ([CLLocationManager authorizationStatus] == kCLAuthorizationStatusDenied) {
    reject(@"E_LOCATION_UNAUTHORIZED", @"Not authorized to use location services", nil);
    return;
  }

  locMgr.distanceFilter = options[@"distanceInterval"] ? [ABI7_0_0RCTConvert double:options[@"distanceInterval"]] ?: kCLDistanceFilterNone : kCLLocationAccuracyHundredMeters;
  locMgr.desiredAccuracy = [ABI7_0_0RCTConvert BOOL:options[@"enableHighAccuracy"]] ? kCLLocationAccuracyBest : kCLLocationAccuracyHundredMeters;

  ABI7_0_0EXLocationDelegate *delegate = [[ABI7_0_0EXLocationDelegate alloc] initWithId:watchId withLocMgr:locMgr onUpdateLocations:^(NSArray<CLLocation *> *locations) {
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
      [_bridge.eventDispatcher sendDeviceEventWithName:@"Exponent.locationChanged"
                                                  body:body];
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

ABI7_0_0RCT_REMAP_METHOD(removeWatchAsync,
                 watchId:(nonnull NSNumber *)watchId
                 resolver:(ABI7_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI7_0_0RCTPromiseRejectBlock)reject)
{
  ABI7_0_0EXLocationDelegate *delegate = _delegates[watchId];
  if (delegate) {
    [delegate.locMgr stopUpdatingLocation];
    [_delegates removeObjectForKey:watchId];
  }
}


- (BOOL)checkInfoPlistWithRejecter:(ABI7_0_0RCTPromiseRejectBlock)reject
{
  if (!([[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSLocationWhenInUseUsageDescription"] ||
        [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSLocationAlwaysUsageDescription"])) {
    reject(@"E_LOCATION_INFO_PLIST", @"Either NSLocationWhenInUseUsageDescription or NSLocationAlwaysUsageDescription key must be present in Info.plist to use geolocation.", nil);
    return NO;
  }
  return YES;
}

@end

NS_ASSUME_NONNULL_END
