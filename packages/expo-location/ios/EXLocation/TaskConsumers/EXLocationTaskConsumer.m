// Copyright 2018-present 650 Industries. All rights reserved.

#import <CoreLocation/CLLocationManager.h>

#import <EXLocation/EXLocation.h>
#import <EXLocation/EXLocationTaskConsumer.h>
#import <EXTaskManagerInterface/EXTaskInterface.h>

@interface EXLocationTaskConsumer ()

@property (nonatomic, strong) CLLocationManager *locationManager;
@property (nonatomic, strong) NSDictionary *options;

@end

@implementation EXLocationTaskConsumer

- (void)dealloc
{
  [self reset];
}

# pragma mark - EXTaskConsumerInterface

- (void)didRegisterTask:(id<EXTaskInterface>)task
{
  _task = task;
  _locationManager = [CLLocationManager new];

  _locationManager.delegate = self;
  _locationManager.allowsBackgroundLocationUpdates = YES;
  _locationManager.pausesLocationUpdatesAutomatically = NO;
  _locationManager.desiredAccuracy = [EXLocation accuracyFromString:task.options[@"accuracy"]];

  if (@available(iOS 11.0, *)) {
    _locationManager.showsBackgroundLocationIndicator = [[task.options objectForKey:@"showsBackgroundLocationIndicator"] boolValue];
  }

  [_locationManager startUpdatingLocation];
  [_locationManager startMonitoringSignificantLocationChanges];
}

- (void)didUnregister
{
  [self reset];
}

# pragma mark - CLLocationManagerDelegate

- (void)locationManager:(CLLocationManager *)manager didUpdateLocations:(NSArray<CLLocation *> *)locations
{
  if (_task != nil) {
    NSDictionary *data = @{
                           @"locations": [EXLocationTaskConsumer _exportLocations:locations],
                           };
    [_task executeWithData:data withError:nil];
  }
}

- (void)locationManager:(CLLocationManager *)manager didFailWithError:(NSError *)error
{
  [_task executeWithData:nil withError:error];
}

# pragma mark - internal

- (void)reset
{
  [_locationManager stopUpdatingLocation];
  [_locationManager stopMonitoringSignificantLocationChanges];
  _locationManager = nil;
  _task = nil;
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
