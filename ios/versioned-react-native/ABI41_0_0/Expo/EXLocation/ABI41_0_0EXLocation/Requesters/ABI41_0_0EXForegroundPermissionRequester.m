// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI41_0_0EXLocation/ABI41_0_0EXForegroundPermissionRequester.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMUtilities.h>

#import <objc/message.h>
#import <CoreLocation/CLLocationManagerDelegate.h>

static SEL whenInUseAuthorizationSelector;

@implementation ABI41_0_0EXForegroundPermissionRequester

+ (NSString *)permissionType
{
  return @"locationForeground";
}

+ (void)load
{
  whenInUseAuthorizationSelector = NSSelectorFromString([@"request" stringByAppendingString:@"WhenInUseAuthorization"]);
}

- (void)requestLocationPermissions
{
  if ([ABI41_0_0EXBaseLocationRequester isConfiguredForWhenInUseAuthorization] && [self.locationManager  respondsToSelector:whenInUseAuthorizationSelector]) {
    ((void (*)(id, SEL))objc_msgSend)(self.locationManager, whenInUseAuthorizationSelector);
  } else {
    self.reject(@"ERR_LOCATION_INFO_PLIST", @"The `NSLocationWhenInUseUsageDescription` key must be present in Info.plist to be able to use geolocation.", nil);
    
    self.resolve = nil;
    self.reject = nil;
  }
}

- (NSDictionary *)parsePermissions:(CLAuthorizationStatus)systemStatus
{
  ABI41_0_0UMPermissionStatus status;

  switch (systemStatus) {
    case kCLAuthorizationStatusAuthorizedWhenInUse:
    case kCLAuthorizationStatusAuthorizedAlways: {
      status = ABI41_0_0UMPermissionStatusGranted;
      break;
    }
    case kCLAuthorizationStatusDenied:
    case kCLAuthorizationStatusRestricted: {
      status = ABI41_0_0UMPermissionStatusDenied;
      break;
    }
    case kCLAuthorizationStatusNotDetermined:
    default: {
      status = ABI41_0_0UMPermissionStatusUndetermined;
      break;
    }
  }
  
  return @{ @"status": @(status) };
}

@end
