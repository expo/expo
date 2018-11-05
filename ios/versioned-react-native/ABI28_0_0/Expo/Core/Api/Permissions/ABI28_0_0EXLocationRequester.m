// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI28_0_0EXLocationRequester.h"

#import <ReactABI28_0_0/ABI28_0_0RCTUtils.h>

#import <CoreLocation/CLLocationManager.h>
#import <CoreLocation/CLLocationManagerDelegate.h>

@interface ABI28_0_0EXLocationRequester () <CLLocationManagerDelegate>

@property (nonatomic, strong) CLLocationManager *locMgr;
@property (nonatomic, strong) ABI28_0_0RCTPromiseResolveBlock resolve;
@property (nonatomic, strong) ABI28_0_0RCTPromiseRejectBlock reject;
@property (nonatomic, weak) id<ABI28_0_0EXPermissionRequesterDelegate> delegate;

@end

@implementation ABI28_0_0EXLocationRequester

+ (NSDictionary *)permissions
{
  ABI28_0_0EXPermissionStatus status;
  NSString *scope = @"none";
  
  CLAuthorizationStatus systemStatus;
  NSString *whenInUseUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSLocationWhenInUseUsageDescription"];
  if (!whenInUseUsageDescription) {
    ABI28_0_0RCTFatal(ABI28_0_0RCTErrorWithMessage(@"This app is missing NSLocationWhenInUseUsageDescription, so location services will fail. Add one of these keys to your bundle's Info.plist."));
    systemStatus = kCLAuthorizationStatusDenied;
  } else {
    systemStatus = [CLLocationManager authorizationStatus];
  }
  
  switch (systemStatus) {
    case kCLAuthorizationStatusAuthorizedWhenInUse: {
      status = ABI28_0_0EXPermissionStatusGranted;
      scope = @"whenInUse";
      break;
    }
    case kCLAuthorizationStatusAuthorizedAlways: {
      status = ABI28_0_0EXPermissionStatusGranted;
      scope = @"always";
      break;
    }
    case kCLAuthorizationStatusDenied: case kCLAuthorizationStatusRestricted: {
      status = ABI28_0_0EXPermissionStatusDenied;
      break;
    }
    case kCLAuthorizationStatusNotDetermined: default: {
      status = ABI28_0_0EXPermissionStatusUndetermined;
      break;
    }
  }
  
  return @{
           @"status": [ABI28_0_0EXPermissions permissionStringForStatus:status],
           @"expires": ABI28_0_0EXPermissionExpiresNever,
           @"ios": @{
               @"scope": scope,
               },
           };
}

- (void)requestPermissionsWithResolver:(ABI28_0_0RCTPromiseResolveBlock)resolve rejecter:(ABI28_0_0RCTPromiseRejectBlock)reject
{
  NSDictionary *existingPermissions = [[self class] permissions];
  if (existingPermissions && ![existingPermissions[@"status"] isEqualToString:[ABI28_0_0EXPermissions permissionStringForStatus:ABI28_0_0EXPermissionStatusUndetermined]]) {
    // since permissions are already determined, the iOS request methods will be no-ops.
    // just resolve with whatever existing permissions.
    resolve(existingPermissions);
    if (_delegate) {
      [_delegate permissionsRequester:self didFinishWithResult:existingPermissions];
    }
  } else {
    _resolve = resolve;
    _reject = reject;

    _locMgr = [[CLLocationManager alloc] init];
    _locMgr.delegate = self;

    if ([[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSLocationWhenInUseUsageDescription"] &&
               [_locMgr respondsToSelector:@selector(requestWhenInUseAuthorization)]) {
        [_locMgr requestWhenInUseAuthorization];
    } else {
      _reject(@"E_LOCATION_INFO_PLIST", @"NSLocationWhenInUseUsageDescription key must be present in Info.plist to use geolocation.", nil);
      if (_delegate) {
        [_delegate permissionsRequester:self didFinishWithResult:nil];
      }
    }
  }
}

- (void)setDelegate:(id<ABI28_0_0EXPermissionRequesterDelegate>)delegate
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
    [_delegate permissionsRequester:self didFinishWithResult:nil];
  }
}

- (void)locationManager:(CLLocationManager *)manager didChangeAuthorizationStatus:(CLAuthorizationStatus)status
{
  if (status == kCLAuthorizationStatusNotDetermined) {
    // CLLocationManager calls this delegate method once on start with kCLAuthorizationNotDetermined even before the user responds
    // to the "Don't Allow" / "Allow" dialog box. This isn't the event we care about so we skip it. See:
    // http://stackoverflow.com/questions/30106341/swift-locationmanager-didchangeauthorizationstatus-always-called/30107511#30107511
    return;
  }
  NSDictionary *result = [[self class] permissions];
  if (_resolve) {
    _resolve(result);
    _resolve = nil;
    _reject = nil;
  }
  if (_delegate) {
    [_delegate permissionsRequester:self didFinishWithResult:result];
  }
}

@end
