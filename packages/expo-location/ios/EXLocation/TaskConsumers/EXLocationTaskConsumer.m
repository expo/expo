// Copyright 2018-present 650 Industries. All rights reserved.

#import <CoreLocation/CLLocationManager.h>
#import <CoreLocation/CLErrorDomain.h>

#import <EXCore/EXUtilities.h>
#import <EXLocation/EXLocation.h>
#import <EXLocation/EXLocationTaskConsumer.h>
#import <EXTaskManagerInterface/EXTaskInterface.h>

@interface EXLocationTaskConsumer ()

@property (nonatomic, strong) CLLocationManager *locationManager;

@end

@implementation EXLocationTaskConsumer

- (void)dealloc
{
  [self reset];
}

# pragma mark - EXTaskConsumerInterface

- (NSString *)taskType
{
  return @"location";
}

- (void)didRegisterTask:(id<EXTaskInterface>)task
{
  [EXUtilities performSynchronouslyOnMainThread:^{
    CLLocationManager *locationManager = [CLLocationManager new];

    self->_task = task;
    self->_locationManager = locationManager;

    locationManager.delegate = self;
    locationManager.allowsBackgroundLocationUpdates = YES;
    locationManager.pausesLocationUpdatesAutomatically = NO;

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
  [EXUtilities performSynchronouslyOnMainThread:^{
    CLLocationManager *locationManager = self->_locationManager;
    EXLocationAccuracy accuracy = [options[@"accuracy"] unsignedIntegerValue] ?: EXLocationAccuracyBalanced;

    locationManager.desiredAccuracy = [EXLocation CLLocationAccuracyFromOption:accuracy];
    locationManager.distanceFilter = [options[@"distanceInterval"] doubleValue] ?: kCLDistanceFilterNone;

    if (@available(iOS 11.0, *)) {
      locationManager.showsBackgroundLocationIndicator = [options[@"showsBackgroundLocationIndicator"] boolValue];
    }

    [locationManager startUpdatingLocation];
    [locationManager startMonitoringSignificantLocationChanges];
  }];
}

# pragma mark - CLLocationManagerDelegate

- (void)locationManager:(CLLocationManager *)manager didUpdateLocations:(NSArray<CLLocation *> *)locations
{
  if (_task != nil && locations.count > 0) {
    NSDictionary *data = @{
                           @"locations": [EXLocationTaskConsumer _exportLocations:locations],
                           };
    [_task executeWithData:data withError:nil];
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
  [EXUtilities performSynchronouslyOnMainThread:^{
    [self->_locationManager stopUpdatingLocation];
    [self->_locationManager stopMonitoringSignificantLocationChanges];
    self->_locationManager = nil;
    self->_task = nil;
  }];
}

+ (NSArray<NSDictionary *> *)_exportLocations:(NSArray<CLLocation *> *)locations
{
  NSMutableArray<NSDictionary *> *result = [NSMutableArray new];

  for (CLLocation *location in locations) {
    [result addObject:[EXLocation exportLocation:location]];
  }
  return result;
}

@end
