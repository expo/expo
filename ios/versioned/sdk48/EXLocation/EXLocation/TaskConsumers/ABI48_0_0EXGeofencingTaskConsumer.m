// Copyright 2018-present 650 Industries. All rights reserved.

#import <CoreLocation/CLCircularRegion.h>
#import <CoreLocation/CLLocationManager.h>
#import <CoreLocation/CLErrorDomain.h>

#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXUtilities.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXTaskInterface.h>
#import <ABI48_0_0EXLocation/ABI48_0_0EXLocation.h>
#import <ABI48_0_0EXLocation/ABI48_0_0EXGeofencingTaskConsumer.h>

@interface ABI48_0_0EXGeofencingTaskConsumer ()

@property (nonatomic, strong) CLLocationManager *locationManager;
@property (nonatomic, strong) NSMutableDictionary<NSString *, NSNumber *> *regionStates;
@property (nonatomic, assign) BOOL backgroundOnly;

@end

@implementation ABI48_0_0EXGeofencingTaskConsumer

- (void)dealloc
{
  [self reset];
}

# pragma mark - ABI48_0_0EXTaskConsumerInterface

- (NSString *)taskType
{
  return @"geofencing";
}

- (void)setOptions:(nonnull NSDictionary *)options
{
  [self stopMonitoringAllRegions];
  [self startMonitoringRegionsForTask:self->_task];
}

- (void)didRegisterTask:(id<ABI48_0_0EXTaskInterface>)task
{
  [self startMonitoringRegionsForTask:task];
}

- (void)didUnregister
{
  [self reset];
}

# pragma mark - helpers

- (void)reset
{
  [self stopMonitoringAllRegions];
  [ABI48_0_0EXUtilities performSynchronouslyOnMainThread:^{
    self->_locationManager = nil;
    self->_task = nil;
  }];
}

- (void)startMonitoringRegionsForTask:(id<ABI48_0_0EXTaskInterface>)task
{
  [ABI48_0_0EXUtilities performSynchronouslyOnMainThread:^{
    CLLocationManager *locationManager = [CLLocationManager new];
    NSMutableDictionary *regionStates = [NSMutableDictionary new];
    NSDictionary *options = [task options];
    NSArray *regions = options[@"regions"];

    self->_task = task;
    self->_locationManager = locationManager;
    self->_regionStates = regionStates;

    locationManager.delegate = self;
    locationManager.allowsBackgroundLocationUpdates = YES;
    locationManager.pausesLocationUpdatesAutomatically = NO;

    for (NSDictionary *regionDict in regions) {
      NSString *identifier = regionDict[@"identifier"] ?: [[NSUUID UUID] UUIDString];
      CLLocationDistance radius = [regionDict[@"radius"] doubleValue];
      CLLocationCoordinate2D center = [self.class coordinateFromDictionary:regionDict];
      BOOL notifyOnEntry = [self.class boolValueFrom:regionDict[@"notifyOnEntry"] defaultValue:YES];
      BOOL notifyOnExit = [self.class boolValueFrom:regionDict[@"notifyOnExit"] defaultValue:YES];

      CLCircularRegion *region = [[CLCircularRegion alloc] initWithCenter:center radius:radius identifier:identifier];

      region.notifyOnEntry = notifyOnEntry;
      region.notifyOnExit = notifyOnExit;

      [regionStates setObject:@(CLRegionStateUnknown) forKey:identifier];
      [locationManager startMonitoringForRegion:region];
      [locationManager requestStateForRegion:region];
    }
  }];
}

- (void)stopMonitoringAllRegions
{
  [ABI48_0_0EXUtilities performSynchronouslyOnMainThread:^{
    for (CLRegion *region in self->_locationManager.monitoredRegions) {
      [self->_locationManager stopMonitoringForRegion:region];
    }
  }];
}

- (void)executeTaskWithRegion:(nonnull CLRegion *)region eventType:(ABI48_0_0EXGeofencingEventType)eventType
{
  if ([region isKindOfClass:[CLCircularRegion class]]) {
    CLCircularRegion *circularRegion = (CLCircularRegion *)region;
    CLRegionState regionState = [self regionStateForIdentifier:circularRegion.identifier];
    NSDictionary *data = @{
                           @"eventType": @(eventType),
                           @"region": [[self class] exportRegion:circularRegion withState:regionState],
                           };

    [_task executeWithData:data withError:nil];
  }
}

# pragma mark - CLLocationManagerDelegate

// There is a bug in iOS that causes didEnterRegion and didExitRegion to be called multiple times.
// https://stackoverflow.com/questions/36807060/region-monitoring-method-getting-called-multiple-times-in-geo-fencing
// To prevent this behavior, we execute tasks only when the state has changed.

- (void)locationManager:(CLLocationManager *)manager didEnterRegion:(CLRegion *)region
{
  if ([self regionStateForIdentifier:region.identifier] != CLRegionStateInside) {
    [self setRegionState:CLRegionStateInside forIdentifier:region.identifier];
    [self executeTaskWithRegion:region eventType:ABI48_0_0EXGeofencingEventTypeEnter];
  }
}

- (void)locationManager:(CLLocationManager *)manager didExitRegion:(CLRegion *)region
{
  if ([self regionStateForIdentifier:region.identifier] != CLRegionStateOutside) {
    [self setRegionState:CLRegionStateOutside forIdentifier:region.identifier];
    [self executeTaskWithRegion:region eventType:ABI48_0_0EXGeofencingEventTypeExit];
  }
}

- (void)locationManager:(CLLocationManager *)manager didFailWithError:(NSError *)error
{
  [_task executeWithData:nil withError:error];
}

- (void)locationManager:(CLLocationManager *)manager monitoringDidFailForRegion:(CLRegion *)region withError:(NSError *)error
{
  if (error && error.domain == kCLErrorDomain) {
    // This error might happen when the device is not able to find out the location. Try to restart monitoring this region.
    [_locationManager stopMonitoringForRegion:region];
    [_locationManager startMonitoringForRegion:region];
    [_locationManager requestStateForRegion:region];
  }
}

- (void)locationManager:(CLLocationManager *)manager didDetermineState:(CLRegionState)state forRegion:(CLRegion *)region
{
  if ([self regionStateForIdentifier:region.identifier] != state) {
    ABI48_0_0EXGeofencingEventType eventType = state == CLRegionStateInside ? ABI48_0_0EXGeofencingEventTypeEnter : ABI48_0_0EXGeofencingEventTypeExit;

    [self setRegionState:state forIdentifier:region.identifier];
    [self executeTaskWithRegion:region eventType:eventType];
  }
}

# pragma mark - helpers

- (CLRegionState)regionStateForIdentifier:(NSString *)identifier
{
  return [_regionStates[identifier] integerValue];
}

- (void)setRegionState:(CLRegionState)regionState forIdentifier:(NSString *)identifier
{
  [_regionStates setObject:@(regionState) forKey:identifier];
}

# pragma mark - static helpers

+ (nonnull NSDictionary *)exportRegion:(nonnull CLCircularRegion *)region withState:(CLRegionState)regionState
{
  return @{
           @"identifier": region.identifier,
           @"state": @([self exportRegionState:regionState]),
           @"radius": @(region.radius),
           @"latitude": @(region.center.latitude),
           @"longitude": @(region.center.longitude),
           };
}

+ (ABI48_0_0EXGeofencingRegionState)exportRegionState:(CLRegionState)regionState
{
  switch (regionState) {
    case CLRegionStateUnknown:
      return ABI48_0_0EXGeofencingRegionStateUnknown;
    case CLRegionStateInside:
      return ABI48_0_0EXGeofencingRegionStateInside;
    case CLRegionStateOutside:
      return ABI48_0_0EXGeofencingRegionStateOutside;
  }
}

+ (CLLocationCoordinate2D)coordinateFromDictionary:(nonnull NSDictionary *)dict
{
  CLLocationDegrees latitude = [dict[@"latitude"] doubleValue];
  CLLocationDegrees longitude = [dict[@"longitude"] doubleValue];
  return CLLocationCoordinate2DMake(latitude, longitude);
}

+ (BOOL)boolValueFrom:(id)pointer defaultValue:(BOOL)defaultValue
{
  return pointer == nil ? defaultValue : [pointer boolValue];
}

@end
