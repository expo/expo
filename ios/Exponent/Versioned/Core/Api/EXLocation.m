// Copyright 2016-present 650 Industries. All rights reserved.

#import "EXLocation.h"
#import "EXUnversioned.h"

#import <CoreLocation/CLLocationManager.h>
#import <CoreLocation/CLLocationManagerDelegate.h>
#import <CoreLocation/CLHeading.h>
#import <CoreLocation/CLGeocoder.h>
#import <CoreLocation/CLPlacemark.h>
#import <CoreLocation/CLError.h>

#import <React/RCTConvert.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTLog.h>

NS_ASSUME_NONNULL_BEGIN

NSString * const EXLocationChangedEventName = @"Exponent.locationChanged";
NSString * const EXHeadingChangedEventName = @"Exponent.headingChanged";

@interface EXLocationDelegate : NSObject <CLLocationManagerDelegate>

@property (nonatomic, strong) NSNumber *watchId;
@property (nonatomic, strong) CLLocationManager *locMgr;
@property (nonatomic, strong) void (^onUpdateLocations)(NSArray<CLLocation *> *locations);
@property (nonatomic, strong) void (^onUpdateHeadings)(CLHeading *newHeading);
@property (nonatomic, strong) void (^onError)(NSError *error);

@end

@implementation EXLocationDelegate

- (instancetype)initWithId:(NSNumber *)watchId
                withLocMgr:(CLLocationManager *)locMgr
         onUpdateLocations:(nullable void (^)(NSArray<CLLocation *> *locations))onUpdateLocations
          onUpdateHeadings:(nullable void (^)(CLHeading *newHeading))onUpdateHeadings
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


@interface EXLocation ()

@property (nonatomic, strong) NSMutableDictionary<NSNumber *, EXLocationDelegate*> *delegates;
@property (nonatomic, strong) CLGeocoder *geocoder;
@property (nonatomic, assign, getter=isPaused) BOOL paused;

@end

@implementation EXLocation

RCT_EXPORT_MODULE(ExponentLocation)

- (instancetype)init {
  if ((self = [super init])) {
    _delegates = [NSMutableDictionary dictionary];
  }
  return self;
}

- (void)setBridge:(RCTBridge *)bridge
{
  [super setBridge:bridge];
  _paused = NO;
  
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(bridgeDidForeground:)
                                               name:EX_UNVERSIONED(@"EXKernelBridgeDidForegroundNotification")
                                             object:self.bridge];
  
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(bridgeDidBackground:)
                                               name:EX_UNVERSIONED(@"EXKernelBridgeDidBackgroundNotification")
                                             object:self.bridge];
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[EXLocationChangedEventName, EXHeadingChangedEventName];
}

RCT_REMAP_METHOD(getProviderStatusAsync,
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  resolve(@{
    @"locationServicesEnabled": @([CLLocationManager locationServicesEnabled]),
  });
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
  if (!([CLLocationManager authorizationStatus] == kCLAuthorizationStatusAuthorizedAlways || [CLLocationManager authorizationStatus] == kCLAuthorizationStatusAuthorizedWhenInUse)) {
    reject(@"E_LOCATION_UNAUTHORIZED", @"Not authorized to use location services", nil);
    return;
  }
  
  __weak typeof(self) weakSelf = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    CLLocationManager *locMgr = [[CLLocationManager alloc] init];
    
    locMgr.distanceFilter = options[@"distanceInterval"] ? [RCTConvert double:options[@"distanceInterval"]] ?: kCLDistanceFilterNone : kCLLocationAccuracyHundredMeters;
    locMgr.desiredAccuracy = [RCTConvert BOOL:options[@"enableHighAccuracy"]] ? kCLLocationAccuracyBest : kCLLocationAccuracyHundredMeters;
    
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
    } onUpdateHeadings:nil onError:^(NSError *error) {
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
RCT_REMAP_METHOD(watchDeviceHeading,
                 watchId:(nonnull NSNumber *)watchId
                 watchDeviceHeading_resolver:(RCTPromiseResolveBlock)resolve
                 watchDeviceHeading_rejecter:(RCTPromiseRejectBlock)reject) {
  __weak typeof(self) weakSelf = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    CLLocationManager *locMgr = [[CLLocationManager alloc] init];
    locMgr.distanceFilter = kCLDistanceFilterNone;
    locMgr.desiredAccuracy = kCLLocationAccuracyBest;
    EXLocationDelegate *delegate = [[EXLocationDelegate alloc] initWithId:watchId withLocMgr:locMgr onUpdateLocations: nil onUpdateHeadings:^(CLHeading *newHeading) {
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
        [weakSelf sendEventWithName:EXHeadingChangedEventName body:body];
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

RCT_REMAP_METHOD(removeWatchAsync,
                 watchId:(nonnull NSNumber *)watchId
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  EXLocationDelegate *delegate = _delegates[watchId];
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

RCT_REMAP_METHOD(geocodeAsync,
                 address: (nonnull NSString *)address
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  if ([self isPaused]) {
    return;
  }
  
  if (!_geocoder) {
    _geocoder = [[CLGeocoder alloc] init];
  }

  [_geocoder geocodeAddressString:address completionHandler:^(NSArray* placemarks, NSError* error){
    if (!error) {
      NSMutableArray *results = [NSMutableArray arrayWithCapacity:placemarks.count];
      for (CLPlacemark* placemark in placemarks)
      {
        CLLocation *location = placemark.location;
        [results addObject:@{
                             @"latitude": @(location.coordinate.latitude),
                             @"longitude": @(location.coordinate.longitude),
                             @"altitude": @(location.altitude),
                             @"accuracy": @(location.horizontalAccuracy),
                             }];
      }
      resolve(results);
    } else if (error.code == kCLErrorGeocodeFoundNoResult || error.code == kCLErrorGeocodeFoundPartialResult) {
      resolve(@[]);
    } else if (error.code == kCLErrorNetwork) {
      reject(@"E_RATE_EXCEEDED", @"Rate limit exceeded - too many requests", error);
    } else {
      reject(@"E_GEOCODING_FAILED", @"Error while geocoding an address", error);
    }
  }];
}

RCT_REMAP_METHOD(reverseGeocodeAsync,
                 locationMap: (nonnull NSDictionary *)locationMap
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  if ([self isPaused]) {
    return;
  }
  
  if (!_geocoder) {
    _geocoder = [[CLGeocoder alloc] init];
  }

  CLLocation *location = [[CLLocation alloc] initWithLatitude:[locationMap[@"latitude"] floatValue] longitude:[locationMap[@"longitude"] floatValue]];

  [_geocoder reverseGeocodeLocation:location completionHandler:^(NSArray* placemarks, NSError* error){
    if (!error) {
      NSMutableArray *results = [NSMutableArray arrayWithCapacity:placemarks.count];
      for (CLPlacemark* placemark in placemarks)
      {
        NSMutableDictionary *address = [NSMutableDictionary dictionary];
        address[@"city"] = placemark.locality;
        address[@"street"] = placemark.thoroughfare;
        address[@"region"] = placemark.administrativeArea;
        address[@"country"] = placemark.country;
        address[@"postalCode"] = placemark.postalCode;
        address[@"name"] = placemark.name;
        address[@"isoCountryCode"] = placemark.ISOcountryCode;
        [results addObject:address];
      }
      resolve(results);
    } else if (error.code == kCLErrorGeocodeFoundNoResult || error.code == kCLErrorGeocodeFoundPartialResult) {
      resolve(@[]);
    } else if (error.code == kCLErrorNetwork) {
      reject(@"E_RATE_EXCEEDED", @"Rate limit exceeded - too many requests", error);
    } else {
      reject(@"E_REVGEOCODING_FAILED", @"Error while reverse-geocoding a location", error);
    }
   }];
}

- (void)bridgeDidForeground:(NSNotification *)notification
{
  if ([self isPaused]) {
    [self setPaused:NO];
  }
}

- (void)bridgeDidBackground:(NSNotification *)notification
{
  if (_geocoder) {
    [self setPaused:YES];
  }
}

@end

NS_ASSUME_NONNULL_END
