//
//  AMPLocationManagerDelegate.m
//  Copyright (c) 2014 Amplitude Inc. (https://amplitude.com/)
//
//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to deal
//  in the Software without restriction, including without limitation the rights
//  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//  copies of the Software, and to permit persons to whom the Software is
//  furnished to do so, subject to the following conditions:
//
//  The above copyright notice and this permission notice shall be included in
//  all copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.
//

#import "AMPLocationManagerDelegate.h"
#import "Amplitude.h"

@implementation AMPLocationManagerDelegate


- (void)locationManager:(CLLocationManager*) manager didFailWithError:(NSError*) error {
}

- (void)locationManager:(CLLocationManager*) manager didUpdateToLocation:(CLLocation*) newLocation fromLocation:(CLLocation*) oldLocation {
}

- (void)locationManager:(CLLocationManager*) manager didChangeAuthorizationStatus:(CLAuthorizationStatus) status {
#if TARGET_OS_IPHONE
// kCLAuthorizationStatusAuthorized is deprecated in iOS 8. Add support for
// the new location authorization types if we're compiling for iOS 8 or higher.
#ifdef __IPHONE_8_0
    if (status == kCLAuthorizationStatusAuthorizedAlways || status == kCLAuthorizationStatusAuthorizedWhenInUse) {
#else
    if (status == kCLAuthorizationStatusAuthorized) {
#endif
#else
    if (status == kCLAuthorizationStatusAuthorized) {
#endif
        SEL updateLocation = NSSelectorFromString(@"updateLocation");
        [Amplitude performSelector:updateLocation];
    }
}
@end
