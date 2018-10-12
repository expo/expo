// Copyright 2018-present 650 Industries. All rights reserved.

#import <CoreLocation/CLCircularRegion.h>
#import <CoreLocation/CLLocationManager.h>

#import <EXLocation/EXGeofencingTaskConsumer.h>
#import <EXTaskManagerInterface/EXTaskInterface.h>

@interface EXGeofencingTaskConsumer ()

@property (nonatomic, strong) CLLocationManager *locationManager;
@property (nonatomic, strong) NSDictionary *options;
@property (nonatomic, strong) NSMutableDictionary<NSString *, NSNumber *> *regionStates;
@property (nonatomic, assign) BOOL backgroundOnly;

@end

@implementation EXGeofencingTaskConsumer

- (void)dealloc
{
  [self reset];
}

# pragma mark - EXTaskConsumerInterface

- (void)setOptions:(nonnull NSDictionary *)options
{
  [self stopMonitoringAllRegions];
  [self startMonitoringRegionsForTask:self->_task];
}

- (void)didRegisterTask:(id<EXTaskInterface>)task
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
  _locationManager = nil;
  _task = nil;
}

- (void)startMonitoringRegionsForTask:(id<EXTaskInterface>)task
{
  _task = task;
  _locationManager = [CLLocationManager new];
  _regionStates = [NSMutableDictionary new];

  NSDictionary *options = [task options];
  NSArray *regions = [options objectForKey:@"regions"];

  _locationManager.delegate = self;
  _locationManager.allowsBackgroundLocationUpdates = YES;
  _locationManager.pausesLocationUpdatesAutomatically = NO;

  for (NSDictionary *regionDict in regions) {
    NSString *identifier = [regionDict objectForKey:@"identifier"] ?: [[NSUUID UUID] UUIDString];
    CLLocationDistance radius = [[regionDict objectForKey:@"radius"] doubleValue];
    CLLocationCoordinate2D center = [self.class coordinateFromDictionary:regionDict];
    BOOL notifyOnEntry = [self.class boolValueFrom:[regionDict objectForKey:@"notifyOnEntry"] defaultValue:YES];
    BOOL notifyOnExit = [self.class boolValueFrom:[regionDict objectForKey:@"notifyOnExit"] defaultValue:YES];

    CLCircularRegion *region = [[CLCircularRegion alloc] initWithCenter:center radius:radius identifier:identifier];

    [region setNotifyOnEntry:notifyOnEntry];
    [region setNotifyOnExit:notifyOnExit];

    [_regionStates setObject:@(CLRegionStateUnknown) forKey:identifier];
    [_locationManager startMonitoringForRegion:region];
  }
}

- (void)stopMonitoringAllRegions
{
  for (CLRegion *region in _locationManager.monitoredRegions) {
    [_locationManager stopMonitoringForRegion:region];
  }
}

- (void)executeTaskWithRegion:(nonnull CLRegion *)region eventType:(nonnull NSString *)eventType
{
  if ([region isKindOfClass:[CLCircularRegion class]]) {
    CLCircularRegion *circularRegion = (CLCircularRegion *)region;
    CLRegionState regionState = [self regionStateForIdentifier:circularRegion.identifier];
    NSDictionary *data = @{
                           @"eventType": eventType,
                           @"region": [[self class] exportRegion:circularRegion withState:regionState],
                           };

    [_task executeWithData:data withError:nil];
  }
}

# pragma mark - CLLocationManagerDelegate

// There is a bug in iOS that causes didEnterRegion and didExitRegion be called multiple times.
// https://stackoverflow.com/questions/36807060/region-monitoring-method-getting-called-multiple-times-in-geo-fencing
// To prevent this behavior, we execute tasks only when the state has changed.

- (void)locationManager:(CLLocationManager *)manager didEnterRegion:(CLRegion *)region
{
  if ([self regionStateForIdentifier:region.identifier] != CLRegionStateInside) {
    [self setRegionState:CLRegionStateInside forIdentifier:region.identifier];
    [self executeTaskWithRegion:region eventType:EXGeofencingEventTypeEnter];
  }
}

- (void)locationManager:(CLLocationManager *)manager didExitRegion:(CLRegion *)region
{
  if ([self regionStateForIdentifier:region.identifier] != CLRegionStateOutside) {
    [self setRegionState:CLRegionStateOutside forIdentifier:region.identifier];
    [self executeTaskWithRegion:region eventType:EXGeofencingEventTypeExit];
  }
}

- (void)locationManager:(CLLocationManager *)manager didFailWithError:(NSError *)error
{
  [_task executeWithData:nil withError:error];
}

# pragma mark - helpers

- (CLRegionState)regionStateForIdentifier:(NSString *)identifier
{
  return [[_regionStates objectForKey:identifier] integerValue];
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
           @"state": [self exportRegionState:regionState],
           @"radius": @(region.radius),
           @"latitude": @(region.center.latitude),
           @"longitude": @(region.center.longitude),
           };
}

+ (NSString *)exportRegionState:(CLRegionState)regionState
{
  switch (regionState) {
    case CLRegionStateUnknown:
      return EXGeofencingRegionStateUnknown;
    case CLRegionStateInside:
      return EXGeofencingRegionStateInside;
    case CLRegionStateOutside:
      return EXGeofencingRegionStateOutside;
  }
}

+ (CLLocationCoordinate2D)coordinateFromDictionary:(nonnull NSDictionary *)dict
{
  CLLocationDegrees latitude = [[dict objectForKey:@"latitude"] doubleValue];
  CLLocationDegrees longitude = [[dict objectForKey:@"longitude"] doubleValue];
  return CLLocationCoordinate2DMake(latitude, longitude);
}

+ (BOOL)boolValueFrom:(id)pointer defaultValue:(BOOL)defaultValue
{
  return pointer == nil ? defaultValue : [pointer boolValue];
}

@end
