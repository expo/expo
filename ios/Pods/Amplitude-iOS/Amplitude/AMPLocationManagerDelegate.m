//
//  AMPLocationManagerDelegate.m

#import "AMPLocationManagerDelegate.h"
#import "Amplitude.h"

@implementation AMPLocationManagerDelegate


- (void)locationManager:(CLLocationManager*) manager didFailWithError:(NSError*) error
{
}

- (void)locationManager:(CLLocationManager*) manager didUpdateToLocation:(CLLocation*) newLocation fromLocation:(CLLocation*) oldLocation
{
}

- (void)locationManager:(CLLocationManager*) manager didChangeAuthorizationStatus:(CLAuthorizationStatus) status
{
    // kCLAuthorizationStatusAuthorized is deprecated in iOS 8. Add support for
    // the new location authorization types if we're compiling for iOS 8 or higher.
#ifdef __IPHONE_8_0
    if (status == kCLAuthorizationStatusAuthorizedAlways || status == kCLAuthorizationStatusAuthorizedWhenInUse) {
#else
    if (status == kCLAuthorizationStatusAuthorized) {
#endif
        SEL updateLocation = NSSelectorFromString(@"updateLocation");
        [Amplitude performSelector:updateLocation];
    }
}

@end
