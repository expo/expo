// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXLocation/EXLocationDelegate.h>

@implementation EXLocationDelegate

- (instancetype)initWithId:(nullable NSNumber *)watchId
                withLocMgr:(CLLocationManager *)locMgr
         onUpdateLocations:(nullable void (^)(NSArray<CLLocation *> *locations))onUpdateLocations
          onUpdateHeadings:(nullable void (^)(CLHeading *newHeading))onUpdateHeadings
                   onError:(nullable void (^)(NSError *error))onError
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
