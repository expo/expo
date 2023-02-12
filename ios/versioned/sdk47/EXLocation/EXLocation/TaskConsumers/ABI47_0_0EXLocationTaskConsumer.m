// Copyright 2018-present 650 Industries. All rights reserved.

#import <CoreLocation/CLLocationManager.h>
#import <CoreLocation/CLErrorDomain.h>

#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXUtilities.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXTaskInterface.h>
#import <ABI47_0_0EXLocation/ABI47_0_0EXLocation.h>
#import <ABI47_0_0EXLocation/ABI47_0_0EXLocationTaskConsumer.h>

@interface ABI47_0_0EXLocationTaskConsumer ()

@property (nonatomic, strong) CLLocationManager *locationManager;
@property (nonatomic, strong) NSMutableArray<CLLocation *> *deferredLocations;
@property (nonatomic, strong) CLLocation *lastReportedLocation;
@property (nonatomic, assign) CLLocationDistance deferredDistance;

@end

@implementation ABI47_0_0EXLocationTaskConsumer

- (instancetype)init
{
  if (self = [super init]) {
    _deferredLocations = [NSMutableArray new];
    _deferredDistance = 0.0;
  }
  return self;
}

- (void)dealloc
{
  [self reset];
}

# pragma mark - ABI47_0_0EXTaskConsumerInterface

- (NSString *)taskType
{
  return @"location";
}

- (void)didRegisterTask:(id<ABI47_0_0EXTaskInterface>)task
{
  [ABI47_0_0EXUtilities performSynchronouslyOnMainThread:^{
    CLLocationManager *locationManager = [CLLocationManager new];

    self->_task = task;
    self->_locationManager = locationManager;

    locationManager.delegate = self;
    locationManager.allowsBackgroundLocationUpdates = YES;

    // Set options-specific things in location manager.
    [self setOptions:task.options];
  }];
}

- (void)didUnregister
{
  [self reset];
}

- (void)setOptions:(NSDictionary *)options
{
  [ABI47_0_0EXUtilities performSynchronouslyOnMainThread:^{
    CLLocationManager *locationManager = self->_locationManager;
    ABI47_0_0EXLocationAccuracy accuracy = [options[@"accuracy"] unsignedIntegerValue] ?: ABI47_0_0EXLocationAccuracyBalanced;

    locationManager.desiredAccuracy = [ABI47_0_0EXLocation CLLocationAccuracyFromOption:accuracy];
    locationManager.distanceFilter = [options[@"distanceInterval"] doubleValue] ?: kCLDistanceFilterNone;
    locationManager.activityType = [ABI47_0_0EXLocation CLActivityTypeFromOption:[options[@"activityType"] integerValue]];
    locationManager.pausesLocationUpdatesAutomatically = [options[@"pausesUpdatesAutomatically"] boolValue];

    locationManager.showsBackgroundLocationIndicator = [options[@"showsBackgroundLocationIndicator"] boolValue];

    [locationManager startUpdatingLocation];
    [locationManager startMonitoringSignificantLocationChanges];
  }];
}

# pragma mark - CLLocationManagerDelegate

- (void)locationManager:(CLLocationManager *)manager didUpdateLocations:(NSArray<CLLocation *> *)locations
{
  if (_task != nil && locations.count > 0) {
    [self deferLocations:locations];
    [self maybeReportDeferredLocations];
  }
}

- (void)locationManager:(CLLocationManager *)manager didFailWithError:(NSError *)error
{
  if (error.domain == kCLErrorDomain) {
    // This error might happen when the device is not able to find out the location. Try to restart monitoring location.
    [manager stopUpdatingLocation];
    [manager stopMonitoringSignificantLocationChanges];
    [manager startUpdatingLocation];
    [manager startMonitoringSignificantLocationChanges];
  } else {
    [_task executeWithData:nil withError:error];
  }
}

# pragma mark - internal

- (void)reset
{
  [ABI47_0_0EXUtilities performSynchronouslyOnMainThread:^{
    [self->_locationManager stopUpdatingLocation];
    [self->_locationManager stopMonitoringSignificantLocationChanges];
    [self->_deferredLocations removeAllObjects];
    self->_lastReportedLocation = nil;
    self->_deferredDistance = 0.0;
    self->_locationManager = nil;
    self->_task = nil;
  }];
}

- (void)executeTaskWithDeferredLocations
{
  // Execute task with deferred locations.
  NSDictionary *data = @{ @"locations": [ABI47_0_0EXLocationTaskConsumer _exportLocations:_deferredLocations] };
  [_task executeWithData:data withError:nil];

  // Reset deferring state.
  _lastReportedLocation = _deferredLocations.lastObject;
  _deferredDistance = 0.0;
  [_deferredLocations removeAllObjects];
}

- (void)maybeReportDeferredLocations
{
  if ([self shouldReportDeferredLocations]) {
    [self executeTaskWithDeferredLocations];
  }
}

- (void)deferLocations:(NSArray<CLLocation *> *)locations
{
  CLLocation *lastLocation = _deferredLocations.lastObject ?: _lastReportedLocation;

  for (CLLocation *location in locations) {
    if (lastLocation) {
      _deferredDistance += [location distanceFromLocation:lastLocation];
    }
    lastLocation = location;
  }
  [_deferredLocations addObjectsFromArray:locations];
}

- (BOOL)shouldReportDeferredLocations
{
  if (_deferredLocations.count <= 0) {
    return NO;
  }
  UIApplicationState appState = [[UIApplication sharedApplication] applicationState];

  if (appState == UIApplicationStateActive) {
    // Don't defer location updates when app is in foreground state.
    return YES;
  }

  CLLocation *oldestLocation = _lastReportedLocation ?: _deferredLocations.firstObject;
  CLLocation *newestLocation = _deferredLocations.lastObject;
  NSDictionary *options = _task.options;
  CLLocationDistance distance = [self numberToDouble:options[@"deferredUpdatesDistance"] defaultValue:0];
  NSTimeInterval interval = [self numberToDouble:options[@"deferredUpdatesInterval"] defaultValue:0];

  return [newestLocation.timestamp timeIntervalSinceDate:oldestLocation.timestamp] >= interval / 1000.0 && _deferredDistance >= distance;
}

- (double)numberToDouble:(NSNumber *)number defaultValue:(double)defaultValue
{
  return number == nil ? defaultValue : [number doubleValue];
}

+ (NSArray<NSDictionary *> *)_exportLocations:(NSArray<CLLocation *> *)locations
{
  NSMutableArray<NSDictionary *> *result = [NSMutableArray new];

  for (CLLocation *location in locations) {
    [result addObject:[ABI47_0_0EXLocation exportLocation:location]];
  }
  return result;
}

@end
