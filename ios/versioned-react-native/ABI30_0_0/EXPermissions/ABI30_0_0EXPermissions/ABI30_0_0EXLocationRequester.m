// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI30_0_0EXPermissions/ABI30_0_0EXLocationRequester.h>

#import <CoreLocation/CLLocationManager.h>
#import <CoreLocation/CLLocationManagerDelegate.h>

@interface ABI30_0_0EXLocationRequester () <CLLocationManagerDelegate>

@property (nonatomic, strong) CLLocationManager *locMgr;
@property (nonatomic, strong) ABI30_0_0EXPromiseResolveBlock resolve;
@property (nonatomic, strong) ABI30_0_0EXPromiseRejectBlock reject;
@property (nonatomic, weak) id<ABI30_0_0EXPermissionRequesterDelegate> delegate;

@end

@implementation ABI30_0_0EXLocationRequester

+ (NSDictionary *)permissions
{
  ABI30_0_0EXPermissionStatus status;
  NSString *scope = @"none";
  
  CLAuthorizationStatus systemStatus;
  NSString *whenInUseUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSLocationWhenInUseUsageDescription"];
  if (!whenInUseUsageDescription) {
    ABI30_0_0EXFatal(ABI30_0_0EXErrorWithMessage(@"This app is missing NSLocationWhenInUseUsageDescription, so location services will fail. Add one of these keys to your bundle's Info.plist."));
    systemStatus = kCLAuthorizationStatusDenied;
  } else {
    systemStatus = [CLLocationManager authorizationStatus];
  }
  
  switch (systemStatus) {
    case kCLAuthorizationStatusAuthorizedWhenInUse: {
      status = ABI30_0_0EXPermissionStatusGranted;
      scope = @"whenInUse";
      break;
    }
    case kCLAuthorizationStatusAuthorizedAlways: {
      status = ABI30_0_0EXPermissionStatusGranted;
      scope = @"always";
      break;
    }
    case kCLAuthorizationStatusDenied: case kCLAuthorizationStatusRestricted: {
      status = ABI30_0_0EXPermissionStatusDenied;
      break;
    }
    case kCLAuthorizationStatusNotDetermined: default: {
      status = ABI30_0_0EXPermissionStatusUndetermined;
      break;
    }
  }
  
  return @{
           @"status": [ABI30_0_0EXPermissions permissionStringForStatus:status],
           @"expires": ABI30_0_0EXPermissionExpiresNever,
           @"ios": @{
               @"scope": scope,
               },
           };
}

- (void)requestPermissionsWithResolver:(ABI30_0_0EXPromiseResolveBlock)resolve rejecter:(ABI30_0_0EXPromiseRejectBlock)reject
{
  NSDictionary *existingPermissions = [[self class] permissions];
  if (existingPermissions && ![existingPermissions[@"status"] isEqualToString:[ABI30_0_0EXPermissions permissionStringForStatus:ABI30_0_0EXPermissionStatusUndetermined]]) {
    // since permissions are already determined, the iOS request methods will be no-ops.
    // just resolve with whatever existing permissions.
    resolve(existingPermissions);
    if (_delegate) {
      [_delegate permissionRequesterDidFinish:self];
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
      _reject(@"E_LOCATION_INFO_PLIST", @"Either NSLocationWhenInUseUsageDescription key must be present in Info.plist to use geolocation.", nil);
      if (_delegate) {
        [_delegate permissionRequesterDidFinish:self];
      }
    }
  }
}

- (void)setDelegate:(id<ABI30_0_0EXPermissionRequesterDelegate>)delegate
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
  // TODO: Permissions.LOCATION issue (search by this phrase)
  // if Permissions.LOCATION is being called for the first time on iOS devide and prompts for user action it might not call this callback at all
  // it happens if user requests more that one permission at the same time via Permissions.askAsync(...) and LOCATION dialog is not being called first
  // to reproduce this find NCL code testing that
  if (status == kCLAuthorizationStatusNotDetermined) {
    // CLLocationManager calls this delegate method once on start with kCLAuthorizationNotDetermined even before the user responds
    // to the "Don't Allow" / "Allow" dialog box. This isn't the event we care about so we skip it. See:
    // http://stackoverflow.com/questions/30106341/swift-locationmanager-didchangeauthorizationstatus-always-called/30107511#30107511
    return;
  }
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
