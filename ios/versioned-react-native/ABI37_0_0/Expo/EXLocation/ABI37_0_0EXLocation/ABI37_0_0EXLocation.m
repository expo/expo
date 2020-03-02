// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI37_0_0EXLocation/ABI37_0_0EXLocation.h>
#import <ABI37_0_0EXLocation/ABI37_0_0EXLocationDelegate.h>
#import <ABI37_0_0EXLocation/ABI37_0_0EXLocationTaskConsumer.h>
#import <ABI37_0_0EXLocation/ABI37_0_0EXGeofencingTaskConsumer.h>
#import <ABI37_0_0EXLocation/ABI37_0_0EXLocationPermissionRequester.h>

#import <CoreLocation/CLLocationManager.h>
#import <CoreLocation/CLLocationManagerDelegate.h>
#import <CoreLocation/CLHeading.h>
#import <CoreLocation/CLGeocoder.h>
#import <CoreLocation/CLPlacemark.h>
#import <CoreLocation/CLError.h>
#import <CoreLocation/CLCircularRegion.h>

#import <ABI37_0_0UMCore/ABI37_0_0UMEventEmitterService.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMAppLifecycleService.h>

#import <ABI37_0_0UMPermissionsInterface/ABI37_0_0UMPermissionsInterface.h>
#import <ABI37_0_0UMPermissionsInterface/ABI37_0_0UMPermissionsMethodsDelegate.h>

#import <ABI37_0_0UMTaskManagerInterface/ABI37_0_0UMTaskManagerInterface.h>

NS_ASSUME_NONNULL_BEGIN

NSString * const ABI37_0_0EXLocationChangedEventName = @"Expo.locationChanged";
NSString * const ABI37_0_0EXHeadingChangedEventName = @"Expo.headingChanged";

@interface ABI37_0_0EXLocation ()

@property (nonatomic, strong) NSMutableDictionary<NSNumber *, ABI37_0_0EXLocationDelegate*> *delegates;
@property (nonatomic, strong) NSMutableSet<ABI37_0_0EXLocationDelegate *> *retainedDelegates;
@property (nonatomic, assign, getter=isPaused) BOOL paused;
@property (nonatomic, weak) id<ABI37_0_0UMEventEmitterService> eventEmitter;
@property (nonatomic, weak) id<ABI37_0_0UMPermissionsInterface> permissionsManager;
@property (nonatomic, weak) id<ABI37_0_0UMAppLifecycleService> lifecycleService;
@property (nonatomic, weak) id<ABI37_0_0UMTaskManagerInterface> tasksManager;

@end

@implementation ABI37_0_0EXLocation

ABI37_0_0UM_EXPORT_MODULE(ExpoLocation);

- (instancetype)init
{
  if (self = [super init]) {
    _delegates = [NSMutableDictionary dictionary];
    _retainedDelegates = [NSMutableSet set];
  }
  return self;
}

- (void)setModuleRegistry:(ABI37_0_0UMModuleRegistry *)moduleRegistry
{
  if (_lifecycleService) {
    [_lifecycleService unregisterAppLifecycleListener:self];
  }

  _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI37_0_0UMEventEmitterService)];
  _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI37_0_0UMPermissionsInterface)];
  [ABI37_0_0UMPermissionsMethodsDelegate registerRequesters:@[[ABI37_0_0EXLocationPermissionRequester new]] withPermissionsManager:_permissionsManager];
  _lifecycleService = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI37_0_0UMAppLifecycleService)];
  _tasksManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI37_0_0UMTaskManagerInterface)];

  if (_lifecycleService) {
    [_lifecycleService registerAppLifecycleListener:self];
  }
}

- (dispatch_queue_t)methodQueue
{
  // Location managers must be created on the main thread
  return dispatch_get_main_queue();
}

# pragma mark - ABI37_0_0UMEventEmitter

- (NSArray<NSString *> *)supportedEvents
{
  return @[ABI37_0_0EXLocationChangedEventName, ABI37_0_0EXHeadingChangedEventName];
}

- (void)startObserving {}
- (void)stopObserving {}

# pragma mark - Exported methods

ABI37_0_0UM_EXPORT_METHOD_AS(getProviderStatusAsync,
                    resolver:(ABI37_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  resolve(@{
            @"locationServicesEnabled": @([CLLocationManager locationServicesEnabled]),
            @"backgroundModeEnabled": @([_tasksManager hasBackgroundModeEnabled:@"location"]),
            });
}


ABI37_0_0UM_EXPORT_METHOD_AS(getCurrentPositionAsync,
                    options:(NSDictionary *)options
                    resolver:(ABI37_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  if (![self checkPermissions:reject]) {
    return;
  }

  CLLocationManager *locMgr = [self locationManagerWithOptions:options];

  __weak typeof(self) weakSelf = self;
  __block ABI37_0_0EXLocationDelegate *delegate;

  delegate = [[ABI37_0_0EXLocationDelegate alloc] initWithId:nil withLocMgr:locMgr onUpdateLocations:^(NSArray<CLLocation *> * _Nonnull locations) {
    if (delegate != nil) {
      if (locations.lastObject != nil) {
        resolve([ABI37_0_0EXLocation exportLocation:locations.lastObject]);
      } else {
        reject(@"E_LOCATION_NOT_FOUND", @"Current location not found.", nil);
      }
      [weakSelf.retainedDelegates removeObject:delegate];
      delegate = nil;
    }
  } onUpdateHeadings:nil onError:^(NSError *error) {
    reject(@"E_LOCATION_UNAVAILABLE", [@"Cannot obtain current location: " stringByAppendingString:error.description], nil);
  }];

  // retain location manager delegate so it will not dealloc until onUpdateLocations gets called
  [_retainedDelegates addObject:delegate];

  locMgr.delegate = delegate;
  [locMgr requestLocation];
}

ABI37_0_0UM_EXPORT_METHOD_AS(watchPositionImplAsync,
                    watchId:(nonnull NSNumber *)watchId
                    options:(NSDictionary *)options
                    resolver:(ABI37_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  if (![self checkPermissions:reject]) {
    return;
  }

  __weak typeof(self) weakSelf = self;
  CLLocationManager *locMgr = [self locationManagerWithOptions:options];

  ABI37_0_0EXLocationDelegate *delegate = [[ABI37_0_0EXLocationDelegate alloc] initWithId:watchId withLocMgr:locMgr onUpdateLocations:^(NSArray<CLLocation *> *locations) {
    if (locations.lastObject != nil && weakSelf != nil) {
      __strong typeof(weakSelf) strongSelf = weakSelf;

      CLLocation *loc = locations.lastObject;
      NSDictionary *body = @{
                             @"watchId": watchId,
                             @"location": [ABI37_0_0EXLocation exportLocation:loc],
                             };

      [strongSelf->_eventEmitter sendEventWithName:ABI37_0_0EXLocationChangedEventName body:body];
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

ABI37_0_0UM_EXPORT_METHOD_AS(getLastKnownPositionAsync,
                    getLastKnownPositionAsync:(ABI37_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  if (![self checkPermissions:reject]) {
    return;
  }
  
  ABI37_0_0UM_WEAKIFY(self)
  __block CLLocationManager *lockMgr = [self locationManagerWithOptions:nil];
  __block ABI37_0_0EXLocationDelegate *delegate;
 
  delegate = [[ABI37_0_0EXLocationDelegate alloc] initWithId:nil withLocMgr:lockMgr onUpdateLocations:^(NSArray<CLLocation *> * _Nonnull locations) {
    if (lockMgr) {
      [lockMgr stopUpdatingLocation];
      lockMgr = nil;
    }
    
    if (delegate) {
      if (locations.lastObject) {
        resolve([ABI37_0_0EXLocation exportLocation:locations.lastObject]);
      } else {
        reject(@"E_LAST_KNOWN_LOCATION_NOT_FOUND", @"Last known location not found.", nil);
      }
      
      ABI37_0_0UM_ENSURE_STRONGIFY(self)
      [self.retainedDelegates removeObject:delegate];
      delegate = nil;
    }
  } onUpdateHeadings:nil onError:^(NSError *error) {
    if (lockMgr) {
      [lockMgr stopUpdatingLocation];
      lockMgr = nil;
    }
    
    reject(@"E_LOCATION_UNAVAILABLE", [@"Cannot obtain last known location: " stringByAppendingString:error.description], nil);
    
    ABI37_0_0UM_ENSURE_STRONGIFY(self)
    if (delegate) {
      [self.retainedDelegates removeObject:delegate];
      delegate = nil;
    }
  }];
  
  lockMgr.delegate = delegate;
  [lockMgr startUpdatingLocation];
}

// Watch method for getting compass updates
ABI37_0_0UM_EXPORT_METHOD_AS(watchDeviceHeading,
                    watchHeadingWithWatchId:(nonnull NSNumber *)watchId
                    resolve:(ABI37_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI37_0_0UMPromiseRejectBlock)reject) {
  if (![_permissionsManager hasGrantedPermissionUsingRequesterClass:[ABI37_0_0EXLocationPermissionRequester class]]) {
    reject(@"E_LOCATION_UNAUTHORIZED", @"Not authorized to use location services", nil);
    return;
  }

  __weak typeof(self) weakSelf = self;
  CLLocationManager *locMgr = [[CLLocationManager alloc] init];

  locMgr.distanceFilter = kCLDistanceFilterNone;
  locMgr.desiredAccuracy = kCLLocationAccuracyBest;
  locMgr.allowsBackgroundLocationUpdates = NO;

  ABI37_0_0EXLocationDelegate *delegate = [[ABI37_0_0EXLocationDelegate alloc] initWithId:watchId withLocMgr:locMgr onUpdateLocations: nil onUpdateHeadings:^(CLHeading *newHeading) {
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
      [strongSelf->_eventEmitter sendEventWithName:ABI37_0_0EXHeadingChangedEventName body:body];
    }
  } onError:^(NSError *error) {
    // Error getting updates
  }];

  _delegates[delegate.watchId] = delegate;
  locMgr.delegate = delegate;
  [locMgr startUpdatingHeading];
  resolve([NSNull null]);
}

ABI37_0_0UM_EXPORT_METHOD_AS(removeWatchAsync,
                    watchId:(nonnull NSNumber *)watchId
                    resolver:(ABI37_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  ABI37_0_0EXLocationDelegate *delegate = _delegates[watchId];

  if (delegate) {
    // Unsuscribe from both location and heading updates
    [delegate.locMgr stopUpdatingLocation];
    [delegate.locMgr stopUpdatingHeading];
    delegate.locMgr.delegate = nil;
    [_delegates removeObjectForKey:watchId];
  }
  resolve([NSNull null]);
}

ABI37_0_0UM_EXPORT_METHOD_AS(geocodeAsync,
                    address:(nonnull NSString *)address
                    resolver:(ABI37_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI37_0_0UMPromiseRejectBlock)reject)
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

ABI37_0_0UM_EXPORT_METHOD_AS(reverseGeocodeAsync,
                    locationMap:(nonnull NSDictionary *)locationMap
                    resolver:(ABI37_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI37_0_0UMPromiseRejectBlock)reject)
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
                                  @"city": placemark.locality ?: [NSNull null],
                                  @"street": placemark.thoroughfare ?: [NSNull null],
                                  @"region": placemark.administrativeArea ?: [NSNull null],
                                  @"country": placemark.country ?: [NSNull null],
                                  @"postalCode": placemark.postalCode ?: [NSNull null],
                                  @"name": placemark.name ?: [NSNull null],
                                  @"isoCountryCode": placemark.ISOcountryCode ?: [NSNull null],
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

ABI37_0_0UM_EXPORT_METHOD_AS(getPermissionsAsync,
                    getPermissionsAsync:(ABI37_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  [ABI37_0_0UMPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[ABI37_0_0EXLocationPermissionRequester class]
                                                            resolve:resolve
                                                             reject:reject];
}

ABI37_0_0UM_EXPORT_METHOD_AS(requestPermissionsAsync,
                    requestPermissionsAsync:(ABI37_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  [ABI37_0_0UMPermissionsMethodsDelegate askForPermissionWithPermissionsManager:_permissionsManager
                                                         withRequester:[ABI37_0_0EXLocationPermissionRequester class]
                                                               resolve:resolve
                                                                reject:reject];
}

ABI37_0_0UM_EXPORT_METHOD_AS(hasServicesEnabledAsync,
                    hasServicesEnabled:(ABI37_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  BOOL servicesEnabled = [CLLocationManager locationServicesEnabled];
  resolve(@(servicesEnabled));
}

# pragma mark - Background location

ABI37_0_0UM_EXPORT_METHOD_AS(startLocationUpdatesAsync,
                    startLocationUpdatesForTaskWithName:(nonnull NSString *)taskName
                    withOptions:(nonnull NSDictionary *)options
                    resolve:(ABI37_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  if (![self checkPermissions:reject] || ![self checkTaskManagerExists:reject] || ![self checkBackgroundServices:reject]) {
    return;
  }
  if (![CLLocationManager significantLocationChangeMonitoringAvailable]) {
    return reject(@"E_SIGNIFICANT_CHANGES_UNAVAILABLE", @"Significant location changes monitoring is not available.", nil);
  }

  @try {
    [_tasksManager registerTaskWithName:taskName consumer:[ABI37_0_0EXLocationTaskConsumer class] options:options];
  }
  @catch (NSException *e) {
    return reject(e.name, e.reason, nil);
  }
  resolve(nil);
}

ABI37_0_0UM_EXPORT_METHOD_AS(stopLocationUpdatesAsync,
                    stopLocationUpdatesForTaskWithName:(NSString *)taskName
                    resolve:(ABI37_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  if (![self checkTaskManagerExists:reject]) {
    return;
  }

  @try {
    [_tasksManager unregisterTaskWithName:taskName consumerClass:[ABI37_0_0EXLocationTaskConsumer class]];
  } @catch (NSException *e) {
    return reject(e.name, e.reason, nil);
  }
  resolve(nil);
}

ABI37_0_0UM_EXPORT_METHOD_AS(hasStartedLocationUpdatesAsync,
                    hasStartedLocationUpdatesForTaskWithName:(nonnull NSString *)taskName
                    resolve:(ABI37_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  if (![self checkTaskManagerExists:reject]) {
    return;
  }

  resolve(@([_tasksManager taskWithName:taskName hasConsumerOfClass:[ABI37_0_0EXLocationTaskConsumer class]]));
}

# pragma mark - Geofencing

ABI37_0_0UM_EXPORT_METHOD_AS(startGeofencingAsync,
                    startGeofencingWithTaskName:(nonnull NSString *)taskName
                    withOptions:(nonnull NSDictionary *)options
                    resolve:(ABI37_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  if (![self checkPermissions:reject] || ![self checkTaskManagerExists:reject]) {
    return;
  }
  if (![CLLocationManager isMonitoringAvailableForClass:[CLCircularRegion class]]) {
    return reject(@"E_GEOFENCING_UNAVAILABLE", @"Geofencing is not available", nil);
  }

  @try {
    [_tasksManager registerTaskWithName:taskName consumer:[ABI37_0_0EXGeofencingTaskConsumer class] options:options];
  } @catch (NSException *e) {
    return reject(e.name, e.reason, nil);
  }
  resolve(nil);
}

ABI37_0_0UM_EXPORT_METHOD_AS(stopGeofencingAsync,
                    stopGeofencingWithTaskName:(nonnull NSString *)taskName
                    resolve:(ABI37_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  if (![self checkTaskManagerExists:reject]) {
    return;
  }

  @try {
    [_tasksManager unregisterTaskWithName:taskName consumerClass:[ABI37_0_0EXGeofencingTaskConsumer class]];
  } @catch (NSException *e) {
    return reject(e.name, e.reason, nil);
  }
  resolve(nil);
}

ABI37_0_0UM_EXPORT_METHOD_AS(hasStartedGeofencingAsync,
                    hasStartedGeofencingForTaskWithName:(NSString *)taskName
                    resolve:(ABI37_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  if (![self checkTaskManagerExists:reject]) {
    return;
  }

  resolve(@([_tasksManager taskWithName:taskName hasConsumerOfClass:[ABI37_0_0EXGeofencingTaskConsumer class]]));
}

# pragma mark - helpers

- (CLLocationManager *)locationManagerWithOptions:(nullable NSDictionary *)options
{
  CLLocationManager *locMgr = [[CLLocationManager alloc] init];
  locMgr.allowsBackgroundLocationUpdates = NO;
  
  if (options) {
    locMgr.distanceFilter = options[@"distanceInterval"] ? [options[@"distanceInterval"] doubleValue] ?: kCLDistanceFilterNone : kCLLocationAccuracyHundredMeters;
    locMgr.desiredAccuracy = [options[@"enableHighAccuracy"] boolValue] ? kCLLocationAccuracyBest : kCLLocationAccuracyHundredMeters;
    

    if (options[@"accuracy"]) {
      ABI37_0_0EXLocationAccuracy accuracy = [options[@"accuracy"] unsignedIntegerValue] ?: ABI37_0_0EXLocationAccuracyBalanced;
      locMgr.desiredAccuracy = [self.class CLLocationAccuracyFromOption:accuracy];
    }
  }
  return locMgr;
}

- (BOOL)checkPermissions:(ABI37_0_0UMPromiseRejectBlock)reject
{
  if (![CLLocationManager locationServicesEnabled]) {
    reject(@"E_LOCATION_SERVICES_DISABLED", @"Location services are disabled", nil);
    return NO;
  }
  if (![_permissionsManager hasGrantedPermissionUsingRequesterClass:[ABI37_0_0EXLocationPermissionRequester class]]) {
    reject(@"E_NO_PERMISSIONS", @"LOCATION permission is required to do this operation.", nil);
    return NO;
  }
  return YES;
}

- (BOOL)checkTaskManagerExists:(ABI37_0_0UMPromiseRejectBlock)reject
{
  if (_tasksManager == nil) {
    reject(@"E_TASKMANAGER_NOT_FOUND", @"`expo-task-manager` module is required to use background services.", nil);
    return NO;
  }
  return YES;
}

- (BOOL)checkBackgroundServices:(ABI37_0_0UMPromiseRejectBlock)reject
{
  if (![_tasksManager hasBackgroundModeEnabled:@"location"]) {
    reject(@"E_BACKGROUND_SERVICES_DISABLED", @"Background Location has not been configured. To enable it, add `location` to `UIBackgroundModes` in Info.plist file.", nil);
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

+ (CLLocationAccuracy)CLLocationAccuracyFromOption:(ABI37_0_0EXLocationAccuracy)accuracy
{
  switch (accuracy) {
    case ABI37_0_0EXLocationAccuracyLowest:
      return kCLLocationAccuracyThreeKilometers;
    case ABI37_0_0EXLocationAccuracyLow:
      return kCLLocationAccuracyKilometer;
    case ABI37_0_0EXLocationAccuracyBalanced:
      return kCLLocationAccuracyHundredMeters;
    case ABI37_0_0EXLocationAccuracyHigh:
      return kCLLocationAccuracyNearestTenMeters;
    case ABI37_0_0EXLocationAccuracyHighest:
      return kCLLocationAccuracyBest;
    case ABI37_0_0EXLocationAccuracyBestForNavigation:
      return kCLLocationAccuracyBestForNavigation;
    default:
      return kCLLocationAccuracyHundredMeters;
  }
}

+ (CLActivityType)CLActivityTypeFromOption:(NSInteger)activityType
{
  if (activityType >= CLActivityTypeOther && activityType <= CLActivityTypeOtherNavigation) {
    return activityType;
  }
  if (@available(iOS 12.0, *)) {
    if (activityType == CLActivityTypeAirborne) {
      return activityType;
    }
  }
  return CLActivityTypeOther;
}

# pragma mark - ABI37_0_0UMAppLifecycleListener

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
