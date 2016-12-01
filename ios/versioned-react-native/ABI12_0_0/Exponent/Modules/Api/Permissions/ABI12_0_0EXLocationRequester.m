// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI12_0_0EXLocationRequester.h"

#import "ABI12_0_0RCTUtils.h"

#import <CoreLocation/CLLocationManager.h>
#import <CoreLocation/CLLocationManagerDelegate.h>

@interface ABI12_0_0EXLocationRequester () <CLLocationManagerDelegate>

@property (nonatomic, strong) CLLocationManager *locMgr;
@property (nonatomic, strong) ABI12_0_0RCTPromiseResolveBlock resolve;
@property (nonatomic, strong) ABI12_0_0RCTPromiseRejectBlock reject;
@property (nonatomic, weak) id<ABI12_0_0EXPermissionRequesterDelegate> delegate;

@end

@implementation ABI12_0_0EXLocationRequester

+ (NSDictionary *)permissions
{
  ABI12_0_0EXPermissionStatus status;
  NSString *scope = @"none";
  
  CLAuthorizationStatus systemStatus;
  NSString *alwaysUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSLocationAlwaysUsageDescription"];
  NSString *whenInUseUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSLocationWhenInUseUsageDescription"];
  if (!(alwaysUsageDescription || whenInUseUsageDescription)) {
    ABI12_0_0RCTFatal(ABI12_0_0RCTErrorWithMessage(@"This app is missing NSLocationAlwaysUsageDescription or NSLocationWhenInUseUsageDescription, so location services will fail. Add one of these keys to your bundle's Info.plist."));
    systemStatus = kCLAuthorizationStatusDenied;
  } else {
    systemStatus = [CLLocationManager authorizationStatus];
  }
  
  switch (systemStatus) {
    case kCLAuthorizationStatusAuthorizedWhenInUse: {
      status = ABI12_0_0EXPermissionStatusGranted;
      scope = @"whenInUse";
      break;
    }
    case kCLAuthorizationStatusAuthorizedAlways: {
      status = ABI12_0_0EXPermissionStatusGranted;
      scope = @"always";
      break;
    }
    case kCLAuthorizationStatusDenied: case kCLAuthorizationStatusRestricted: {
      status = ABI12_0_0EXPermissionStatusDenied;
      break;
    }
    case kCLAuthorizationStatusNotDetermined: default: {
      status = ABI12_0_0EXPermissionStatusUndetermined;
      break;
    }
  }
  
  return @{
           @"status": [ABI12_0_0EXPermissions permissionStringForStatus:status],
           @"expires": ABI12_0_0EXPermissionExpiresNever,
           @"ios": @{
               @"scope": scope,
               },
           };
}

- (void)requestPermissionsWithResolver:(ABI12_0_0RCTPromiseResolveBlock)resolve rejecter:(ABI12_0_0RCTPromiseRejectBlock)reject
{
  NSDictionary *existingPermissions = [[self class] permissions];
  if (existingPermissions && ![existingPermissions[@"status"] isEqualToString:[ABI12_0_0EXPermissions permissionStringForStatus:ABI12_0_0EXPermissionStatusUndetermined]]) {
    // since permissions are already determined, the iOS request methods will be no-ops.
    // just resolve with whatever existing permissions.
    resolve(existingPermissions);
    if (_delegate) {
      [_delegate permissionRequesterDidFinish:self];
    }
  } else {
    _resolve = resolve;
    _reject = reject;

    __weak typeof(self) weakSelf = self;
    _locMgr = [[CLLocationManager alloc] init];
    _locMgr.delegate = self;

    if ([[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSLocationAlwaysUsageDescription"] &&
        [_locMgr respondsToSelector:@selector(requestAlwaysAuthorization)]) {
      dispatch_async(dispatch_get_main_queue(), ^{
        [weakSelf.locMgr requestAlwaysAuthorization];
      });
    } else if ([[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSLocationWhenInUseUsageDescription"] &&
               [_locMgr respondsToSelector:@selector(requestWhenInUseAuthorization)]) {
      dispatch_async(dispatch_get_main_queue(), ^{
        [weakSelf.locMgr requestWhenInUseAuthorization];
      });
    } else {
      _reject(@"E_LOCATION_INFO_PLIST", @"Either NSLocationWhenInUseUsageDescription or NSLocationAlwaysUsageDescription key must be present in Info.plist to use geolocation.", nil);
      if (_delegate) {
        [_delegate permissionRequesterDidFinish:self];
      }
    }
  }
}

- (void)setDelegate:(id<ABI12_0_0EXPermissionRequesterDelegate>)delegate
{
  _delegate = delegate;
}

#pragma mark - CLLocationManagerDelegate

- (void)locationManager:(CLLocationManager *)manager didFailWithError:(NSError *)error
{
  if (_reject) {
    _reject(@"E_LOCATION_ERROR_UNKNOWN", error.localizedDescription, error);
    _resolve = nil;
    _reject = nil;
  }
  if (_delegate) {
    [_delegate permissionRequesterDidFinish:self];
  }
}

- (void)locationManager:(CLLocationManager *)manager didChangeAuthorizationStatus:(CLAuthorizationStatus)status
{
  if (_resolve) {
    _resolve([[self class] permissions]);
    _resolve = nil;
    _reject = nil;
  }
  if (_delegate) {
    [_delegate permissionRequesterDidFinish:self];
  }
}

@end
