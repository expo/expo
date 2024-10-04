// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI42_0_0EXLocation/ABI42_0_0EXBaseLocationRequester.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMUtilities.h>

#import <objc/message.h>
#import <CoreLocation/CLLocationManagerDelegate.h>

@interface ABI42_0_0EXBaseLocationRequester () <CLLocationManagerDelegate>

@property (nonatomic, assign) bool locationManagerWasCalled;


@end

@implementation ABI42_0_0EXBaseLocationRequester

# pragma mark - Abstract methods

- (void)requestLocationPermissions
{
  @throw([NSException exceptionWithName:@"NotImplemented" reason:@"requestLocationPermissions should be implemented" userInfo:nil]);
}

+ (NSString *)permissionType {
  @throw([NSException exceptionWithName:@"NotImplemented" reason:@"permissionType should be implemented" userInfo:nil]);
}

- (NSDictionary *)parsePermissions:(CLAuthorizationStatus)systemStatus
{
  @throw([NSException exceptionWithName:@"NotImplemented" reason:@"parsePermissions should be implemented" userInfo:nil]);
}

# pragma mark - ABI42_0_0UMPermissionsRequester

- (NSDictionary *)getPermissions {
  
  CLAuthorizationStatus systemStatus;
  if (![ABI42_0_0EXBaseLocationRequester isConfiguredForAlwaysAuthorization] && ![ABI42_0_0EXBaseLocationRequester isConfiguredForWhenInUseAuthorization]) {
    ABI42_0_0UMFatal(ABI42_0_0UMErrorWithMessage(@"This app is missing usage descriptions, so location services will fail. Add one of the `NSLocation*UsageDescription` keys to your bundle's Info.plist. See https://bit.ly/2P5fEbG (https://docs.expo.io/versions/latest/guides/app-stores.html#system-permissions-dialogs-on-ios) for more information."));
    systemStatus = kCLAuthorizationStatusDenied;
  } else {
    systemStatus = [CLLocationManager authorizationStatus];
  }
  
  return [self parsePermissions:systemStatus];
}

- (void)requestPermissionsWithResolver:(ABI42_0_0UMPromiseResolveBlock)resolve rejecter:(ABI42_0_0UMPromiseRejectBlock)reject {
  NSDictionary *existingPermissions = [self getPermissions];
  if (existingPermissions && [existingPermissions[@"status"] intValue] != ABI42_0_0EXPermissionStatusUndetermined) {
    // since permissions are already determined, the iOS request methods will be no-ops.
    // just resolve with whatever existing permissions.
    resolve(existingPermissions);
  } else {
    _resolve = resolve;
    _reject = reject;

    ABI42_0_0UM_WEAKIFY(self)
    [ABI42_0_0UMUtilities performSynchronouslyOnMainThread:^{
      ABI42_0_0UM_ENSURE_STRONGIFY(self)
      self.locationManagerWasCalled = false;
      self.locationManager = [[CLLocationManager alloc] init];
      self.locationManager.delegate = self;
    }];

    // 1. Why do we call CLLocationManager methods by those dynamically created selectors?
    //
    //    Most probably application code submitted to Apple Store is statically analyzed
    //    paying special attention to camelcase(request_always_location) being called on CLLocationManager.
    //    This lets Apple warn developers when it notices that location authorization may be requested
    //    while there is no NSLocationUsageDescription in Info.plist. Since we want to neither
    //    make Expo developers receive this kind of messages nor add our own default usage description,
    //    we try to fool the static analyzer and construct the selector in runtime.
    //    This way behavior of this requester is governed by provided NSLocationUsageDescriptions.
    //
    // 2. Why there's no way to call specifically whenInUse or always authorization?
    //
    //    The requester sets itself as the delegate of the CLLocationManager, so when the user responds
    //    to a permission requesting dialog, manager calls `locationManager:didChangeAuthorizationStatus:` method.
    //    To be precise, manager calls this method in two circumstances:
    //      - right when `request*Authorization` method is called,
    //      - when `authorizationStatus` changes.
    //    With this behavior we aren't able to support the following use case:
    //      - app requests `whenInUse` authorization
    //      - user allows `whenInUse` authorization
    //      - `authorizationStatus` changes from `undetermined` to `whenInUse`, callback is called, promise is resolved
    //      - app wants to escalate authorization to `always`
    //      - user selects `whenInUse` authorization (iOS 11+)
    //      - `authorizationStatus` doesn't change, so callback is not called and requester can't know whether
    //        user responded to the dialog selecting `whenInUse` or is still deciding
    //    To support this use case we will have to change the way location authorization is requested
    //    from promise-based to listener-based.

    [self requestLocationPermissions];
  }
}

#pragma mark - CLLocationManagerDelegate

- (void)locationManager:(CLLocationManager *)manager didFailWithError:(NSError *)error
{
  if (_reject) {
    _reject(@"E_LOCATION_ERROR_UNKNOWN", error.localizedDescription, error);
    _resolve = nil;
    _reject = nil;
  }
}

- (void)locationManager:(CLLocationManager *)manager didChangeAuthorizationStatus:(CLAuthorizationStatus)status
{
  // TODO: Permissions.LOCATION issue (search by this phrase)
  // if Permissions.LOCATION is being called for the first time on iOS devide and prompts for user action it might not call this callback at all
  // it happens if user requests more that one permission at the same time via Permissions.askAsync(...) and LOCATION dialog is not being called first
  // to reproduce this find NCL code testing that
  if (status == kCLAuthorizationStatusNotDetermined || !_locationManagerWasCalled) {
    // CLLocationManager calls this delegate method once on start with kCLAuthorizationNotDetermined even before the user responds
    // to the "Don't Allow" / "Allow" dialog box. This isn't the event we care about so we skip it. See:
    // http://stackoverflow.com/questions/30106341/swift-locationmanager-didchangeauthorizationstatus-always-called/30107511#30107511
    _locationManagerWasCalled = true;
    return;
  }
  
  if (_resolve) {
    _resolve([self getPermissions]);
    _resolve = nil;
    _reject = nil;
  }
}

- (void)locationManagerDidChangeAuthorization:(CLLocationManager *)manager
{
  if (@available(iOS 14.0, *)) {
    CLAuthorizationStatus status = [manager authorizationStatus];
    if (status == kCLAuthorizationStatusNotDetermined || !_locationManagerWasCalled) {
      // CLLocationManager calls this delegate method once on start with kCLAuthorizationNotDetermined even before the user responds
      // to the "Don't Allow" / "Allow" dialog box. This isn't the event we care about so we skip it. See:
      // http://stackoverflow.com/questions/30106341/swift-locationmanager-didchangeauthorizationstatus-always-called/30107511#30107511
      _locationManagerWasCalled = true;
      return;
    }
 
    if (_resolve) {
      _resolve([self getPermissions]);
      _resolve = nil;
      _reject = nil;
    }
  }
}

#pragma mark - Helpers
  
+ (BOOL)isConfiguredForWhenInUseAuthorization
{
  return [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSLocationWhenInUseUsageDescription"] != nil;
}

+ (BOOL)isConfiguredForAlwaysAuthorization
{
  if (@available(iOS 11.0, *)) {
    return [self isConfiguredForWhenInUseAuthorization] && [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSLocationAlwaysAndWhenInUseUsageDescription"];
  }

  // iOS 10 fallback
  return [self isConfiguredForWhenInUseAuthorization] && [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSLocationAlwaysUsageDescription"];
}

  
@end
