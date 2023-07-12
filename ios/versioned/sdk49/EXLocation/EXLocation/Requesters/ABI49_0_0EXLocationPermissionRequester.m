// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI49_0_0EXLocation/ABI49_0_0EXLocationPermissionRequester.h>

#import <objc/message.h>
#import <CoreLocation/CLLocationManagerDelegate.h>

static SEL alwaysAuthorizationSelector;
static SEL whenInUseAuthorizationSelector;

@implementation ABI49_0_0EXLocationPermissionRequester

+ (NSString *)permissionType
{
  return @"location";
}

+ (void)load
{
  alwaysAuthorizationSelector = NSSelectorFromString([@"request" stringByAppendingString:@"AlwaysAuthorization"]);
  whenInUseAuthorizationSelector = NSSelectorFromString([@"request" stringByAppendingString:@"WhenInUseAuthorization"]);
}

- (void)requestLocationPermissions
{
  if ([ABI49_0_0EXBaseLocationRequester isConfiguredForAlwaysAuthorization] && [self.locationManager respondsToSelector:alwaysAuthorizationSelector]) {
    ((void (*)(id, SEL))objc_msgSend)(self.locationManager, alwaysAuthorizationSelector);
  } else if ([ABI49_0_0EXBaseLocationRequester isConfiguredForWhenInUseAuthorization] && [self.locationManager respondsToSelector:whenInUseAuthorizationSelector]) {
    ((void (*)(id, SEL))objc_msgSend)(self.locationManager, whenInUseAuthorizationSelector);
  } else {
    self.reject(@"E_LOCATION_INFO_PLIST", @"One of the `NSLocation*UsageDescription` keys must be present in Info.plist to be able to use geolocation.", nil);
    
    self.resolve = nil;
    self.reject = nil;
  }
}

- (NSDictionary *)parsePermissions:(CLAuthorizationStatus)systemStatus
{
  ABI49_0_0EXPermissionStatus status;
  NSString *scope = @"none";
  
  switch (systemStatus) {
    case kCLAuthorizationStatusAuthorizedWhenInUse: {
      status = ABI49_0_0EXPermissionStatusGranted;
      scope = @"whenInUse";
      break;
    }
    case kCLAuthorizationStatusAuthorizedAlways: {
      status = ABI49_0_0EXPermissionStatusGranted;
      scope = @"always";
      break;
    }
    case kCLAuthorizationStatusDenied:
    case kCLAuthorizationStatusRestricted: {
      status = ABI49_0_0EXPermissionStatusDenied;
      break;
    }
    case kCLAuthorizationStatusNotDetermined:
    default: {
      status = ABI49_0_0EXPermissionStatusUndetermined;
      break;
    }
  }
  
  return @{
           @"status": @(status),
           @"scope": scope
           };
}

@end
