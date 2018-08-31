// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI30_0_0EXLocation/ABI30_0_0EXLocation.h>
#import <ABI30_0_0EXLocation/ABI30_0_0EXLocationDelegate.h>

#import <CoreLocation/CLLocationManager.h>
#import <CoreLocation/CLLocationManagerDelegate.h>
#import <CoreLocation/CLHeading.h>
#import <CoreLocation/CLGeocoder.h>
#import <CoreLocation/CLPlacemark.h>
#import <CoreLocation/CLError.h>

#import <ABI30_0_0EXCore/ABI30_0_0EXEventEmitterService.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXAppLifecycleService.h>
#import <ABI30_0_0EXPermissionsInterface/ABI30_0_0EXPermissionsInterface.h>

NS_ASSUME_NONNULL_BEGIN

NSString * const ABI30_0_0EXLocationChangedEventName = @"Exponent.locationChanged";
NSString * const ABI30_0_0EXHeadingChangedEventName = @"Exponent.headingChanged";

@interface ABI30_0_0EXLocation ()

@property (nonatomic, strong) NSMutableDictionary<NSNumber *, ABI30_0_0EXLocationDelegate*> *delegates;
@property (nonatomic, strong) NSMutableSet<ABI30_0_0EXLocationDelegate *> *retainedDelegates;
@property (nonatomic, assign, getter=isPaused) BOOL paused;
@property (nonatomic, weak) id<ABI30_0_0EXEventEmitterService> eventEmitter;
@property (nonatomic, weak) id<ABI30_0_0EXPermissionsInterface> permissions;
@property (nonatomic, weak) id<ABI30_0_0EXAppLifecycleService> lifecycleService;

@end

@implementation ABI30_0_0EXLocation

ABI30_0_0EX_EXPORT_MODULE(ExpoLocation);

- (instancetype)init
{
  if (self = [super init]) {
    _delegates = [NSMutableDictionary dictionary];
    _retainedDelegates = [NSMutableSet set];
  }
  return self;
}

- (void)setModuleRegistry:(ABI30_0_0EXModuleRegistry *)moduleRegistry
{
  if (_lifecycleService) {
    [_lifecycleService unregisterAppLifecycleListener:self];
  }

  _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI30_0_0EXEventEmitterService)];
  _permissions = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI30_0_0EXPermissionsInterface)];
  _lifecycleService = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI30_0_0EXAppLifecycleService)];

  if (_lifecycleService) {
    [_lifecycleService registerAppLifecycleListener:self];
  }
}

- (dispatch_queue_t)methodQueue
{
  // Location managers must be created on the main thread
  return dispatch_get_main_queue();
}

# pragma mark - ABI30_0_0EXEventEmitter

- (NSArray<NSString *> *)supportedEvents
{
  return @[ABI30_0_0EXLocationChangedEventName, ABI30_0_0EXHeadingChangedEventName];
}

- (void)startObserving {}
- (void)stopObserving {}

# pragma mark - Exported methods

ABI30_0_0EX_EXPORT_METHOD_AS(getProviderStatusAsync,
                    resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
{
  resolve(@{
            @"locationServicesEnabled": @([CLLocationManager locationServicesEnabled]),
            });
}


ABI30_0_0EX_EXPORT_METHOD_AS(getCurrentPositionAsync,
                    options:(NSDictionary *)options
                    resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
{
  if (![self checkPermissions:reject]) {
    return;
  }

  CLLocationManager *locMgr = [self locationManagerWithOptions:options];

  __weak typeof(self) weakSelf = self;
  __block ABI30_0_0EXLocationDelegate *delegate;

  delegate = [[ABI30_0_0EXLocationDelegate alloc] initWithId:nil withLocMgr:locMgr onUpdateLocations:^(NSArray<CLLocation *> * _Nonnull locations) {
    if (delegate != nil) {
      if (locations.lastObject != nil) {
        resolve([ABI30_0_0EXLocation exportLocation:locations.lastObject]);
      } else {
        reject(@"E_LOCATION_NOT_FOUND", @"Current location not found.", nil);
      }
      [weakSelf.retainedDelegates removeObject:delegate];
      delegate = nil;
    }
  } onUpdateHeadings:nil onError:nil];

  // retain location manager delegate so it will not dealloc until onUpdateLocations gets called
  [_retainedDelegates addObject:delegate];

  locMgr.delegate = delegate;
  [locMgr requestLocation];
}

ABI30_0_0EX_EXPORT_METHOD_AS(watchPositionImplAsync,
                    watchId:(nonnull NSNumber *)watchId
                    options:(NSDictionary *)options
                    resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
{
  if (![self checkPermissions:reject]) {
    return;
  }

  __weak typeof(self) weakSelf = self;
  CLLocationManager *locMgr = [self locationManagerWithOptions:options];

  ABI30_0_0EXLocationDelegate *delegate = [[ABI30_0_0EXLocationDelegate alloc] initWithId:watchId withLocMgr:locMgr onUpdateLocations:^(NSArray<CLLocation *> *locations) {
    if (locations.lastObject != nil && weakSelf != nil) {
      __strong typeof(weakSelf) strongSelf = weakSelf;

      CLLocation *loc = locations.lastObject;
      NSDictionary *body = @{
                             @"watchId": watchId,
                             @"location": [ABI30_0_0EXLocation exportLocation:loc],
                             };

      [strongSelf->_eventEmitter sendEventWithName:ABI30_0_0EXLocationChangedEventName body:body];
    }
  } onUpdateHeadings:nil onError:^(NSError *error) {
    // TODO: report errors
    // (ben) error could be (among other things):
    //   - kCLErrorDenied - we should use the same UNAUTHORIZED behavior as elsewhere
    //   - kCLErrorLocationUnknown - we can actually ignore this error and keep tracking
    //     location (I think -- my knowledge might be a few months out of date)
  }];

  _delegates[delegate.watchId] = delegate;
  locMgr.delegate = delegate;
  [locMgr startUpdatingLocation];
  resolve([NSNull null]);
}

// Watch method for getting compass updates
ABI30_0_0EX_EXPORT_METHOD_AS(watchDeviceHeading,
                    watchHeadingWithWatchId:(nonnull NSNumber *)watchId
                    resolve:(ABI30_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI30_0_0EXPromiseRejectBlock)reject) {
  if (![_permissions hasGrantedPermission:@"location"]) {
    reject(@"E_LOCATION_UNAUTHORIZED", @"Not authorized to use location services", nil);
    return;
  }

  __weak typeof(self) weakSelf = self;
  CLLocationManager *locMgr = [[CLLocationManager alloc] init];

  locMgr.distanceFilter = kCLDistanceFilterNone;
  locMgr.desiredAccuracy = kCLLocationAccuracyBest;
  locMgr.allowsBackgroundLocationUpdates = NO;

  ABI30_0_0EXLocationDelegate *delegate = [[ABI30_0_0EXLocationDelegate alloc] initWithId:watchId withLocMgr:locMgr onUpdateLocations: nil onUpdateHeadings:^(CLHeading *newHeading) {
    if (newHeading != nil && weakSelf != nil) {
      __strong typeof(weakSelf) strongSelf = weakSelf;
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
      [strongSelf->_eventEmitter sendEventWithName:ABI30_0_0EXHeadingChangedEventName body:body];
    }
  } onError:^(NSError *error) {
    // Error getting updates
  }];

  _delegates[delegate.watchId] = delegate;
  locMgr.delegate = delegate;
  [locMgr startUpdatingHeading];
  resolve([NSNull null]);
}

ABI30_0_0EX_EXPORT_METHOD_AS(removeWatchAsync,
                    watchId:(nonnull NSNumber *)watchId
                    resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
{
  ABI30_0_0EXLocationDelegate *delegate = _delegates[watchId];

  if (delegate) {
    // Unsuscribe from both location and heading updates
    [delegate.locMgr stopUpdatingLocation];
    [delegate.locMgr stopUpdatingHeading];
    delegate.locMgr.delegate = nil;
    [_delegates removeObjectForKey:watchId];
  }
  resolve([NSNull null]);
}

ABI30_0_0EX_EXPORT_METHOD_AS(geocodeAsync,
                    address:(nonnull NSString *)address
                    resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
{
  if ([self isPaused]) {
    return;
  }

  CLGeocoder *geocoder = [[CLGeocoder alloc] init];

  [geocoder geocodeAddressString:address completionHandler:^(NSArray* placemarks, NSError* error){
    if (!error) {
      NSMutableArray *results = [NSMutableArray arrayWithCapacity:placemarks.count];
      for (CLPlacemark* placemark in placemarks) {
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

ABI30_0_0EX_EXPORT_METHOD_AS(reverseGeocodeAsync,
                    locationMap:(nonnull NSDictionary *)locationMap
                    resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
{
  if ([self isPaused]) {
    return;
  }

  CLGeocoder *geocoder = [[CLGeocoder alloc] init];
  CLLocation *location = [[CLLocation alloc] initWithLatitude:[locationMap[@"latitude"] floatValue] longitude:[locationMap[@"longitude"] floatValue]];

  [geocoder reverseGeocodeLocation:location completionHandler:^(NSArray* placemarks, NSError* error){
    if (!error) {
      NSMutableArray *results = [NSMutableArray arrayWithCapacity:placemarks.count];
      for (CLPlacemark* placemark in placemarks) {
        NSDictionary *address = @{
                                  @"city": placemark.locality,
                                  @"street": placemark.thoroughfare,
                                  @"region": placemark.administrativeArea,
                                  @"country": placemark.country,
                                  @"postalCode": placemark.postalCode,
                                  @"name": placemark.name,
                                  @"isoCountryCode": placemark.ISOcountryCode,
                                  };
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

ABI30_0_0EX_EXPORT_METHOD_AS(requestPermissionsAsync,
                    requestPermissionsResolver:(ABI30_0_0EXPromiseResolveBlock)resolve
                                      rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
{
  if (_permissions == nil) {
    return reject(@"E_NO_PERMISSIONS", @"Permissions module is null. Are you sure all the installed Expo modules are properly linked?", nil);
  }
  
  [_permissions askForPermission:@"location"
                      withResult:^(BOOL result){
                        if (!result) {
                          return reject(@"E_LOCATION_UNAUTHORIZED", @"Not authorized to use location services", nil);
                        }
                        resolve(nil);
                      }
                    withRejecter:reject];
}

# pragma mark - helpers

- (CLLocationManager *)locationManagerWithOptions:(NSDictionary *)options
{
  CLLocationManager *locMgr = [[CLLocationManager alloc] init];

  locMgr.distanceFilter = options[@"distanceInterval"] ? [options[@"distanceInterval"] doubleValue] ?: kCLDistanceFilterNone : kCLLocationAccuracyHundredMeters;
  locMgr.desiredAccuracy = [options[@"enableHighAccuracy"] boolValue] ? kCLLocationAccuracyBest : kCLLocationAccuracyHundredMeters;
  locMgr.allowsBackgroundLocationUpdates = NO;

  return locMgr;
}

- (BOOL)checkPermissions:(ABI30_0_0EXPromiseRejectBlock)reject
{
  if (![CLLocationManager locationServicesEnabled]) {
    reject(@"E_LOCATION_SERVICES_DISABLED", @"Location services are disabled", nil);
    return NO;
  }
  if (![_permissions hasGrantedPermission:@"location"]) {
    reject(@"E_LOCATION_UNAUTHORIZED", @"Not authorized to use location services", nil);
    return NO;
  }
  return YES;
}

# pragma mark - static helpers

+ (NSDictionary *)exportLocation:(CLLocation *)location
{
  return @{
    @"coords": @{
        @"latitude": @(location.coordinate.latitude),
        @"longitude": @(location.coordinate.longitude),
        @"altitude": @(location.altitude),
        @"accuracy": @(location.horizontalAccuracy),
        @"altitudeAccuracy": @(location.verticalAccuracy),
        @"heading": @(location.course),
        @"speed": @(location.speed),
        },
    @"timestamp": @([location.timestamp timeIntervalSince1970] * 1000),
    };
}

# pragma mark - ABI30_0_0EXAppLifecycleListener

- (void)onAppForegrounded
{
  if ([self isPaused]) {
    [self setPaused:NO];
  }
}

- (void)onAppBackgrounded
{
  if (![self isPaused]) {
    [self setPaused:YES];
  }
}

@end

NS_ASSUME_NONNULL_END
