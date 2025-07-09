// Copyright 2016-present 650 Industries. All rights reserved.

#import <ExpoLocation/EXBaseLocationRequester.h>
#import <ExpoModulesCore/EXUtilities.h>

#import <objc/message.h>

@interface EXBaseLocationRequester () <CLLocationManagerDelegate>

@property (nonatomic, assign) bool locationManagerWasCalled;
@property (nonatomic, assign) CLAuthorizationStatus beginStatus;

@end

@implementation EXBaseLocationRequester

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

# pragma mark - UMPermissionsRequester

- (NSDictionary *)getPermissions {

  CLAuthorizationStatus systemStatus;
  if (![EXBaseLocationRequester isConfiguredForAlwaysAuthorization] && ![EXBaseLocationRequester isConfiguredForWhenInUseAuthorization]) {
    EXFatal(EXErrorWithMessage(@"This app is missing usage descriptions, so location services will fail. Add one of the `NSLocation*UsageDescription` keys to your bundle's Info.plist. See https://bit.ly/3iLqy6S (https://docs.expo.dev/distribution/app-stores/#system-permissions-dialogs-on-ios) for more information."));
    systemStatus = kCLAuthorizationStatusDenied;
  } else {
    systemStatus = [CLLocationManager authorizationStatus];
  }

  return [self parsePermissions:systemStatus];
}

- (void)requestPermissionsWithResolver:(EXPromiseResolveBlock)resolve rejecter:(EXPromiseRejectBlock)reject {
  NSDictionary *existingPermissions = [self getPermissions];
  if (existingPermissions && [existingPermissions[@"status"] intValue] != EXPermissionStatusUndetermined) {
    // since permissions are already determined, the iOS request methods will be no-ops.
    // just resolve with whatever existing permissions.
    resolve(existingPermissions);
  } else {
    _resolve = resolve;
    _reject = reject;

    EX_WEAKIFY(self)
    [EXUtilities performSynchronouslyOnMainThread:^{
      EX_ENSURE_STRONGIFY(self)
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
    
    // 2. Location permission request types
    //
    //    Foreground
    //    - "Allow once"
    //    - "Allow while using App"
    //    - "Don't allow"
    //
    //    Background
    //    - "Keep only while using"
    //    - "Change to always allow"
    //
    // Requesting background permissions directly without first asking for foreground permissions is the
    // same as asking for foreground permissions and then asking for background permissions.
    //
    // "Allow once" is a temporary permission (limited to the current app session). It is not possible to get
    // info from the API about wether or not the current permission is temporary. You cannot request background
    // permissions with a temporary token - a background request will then return denied.
    //
    // Requesting background permissions directly and "Allow while using the App" gives you a provisional
    // background permission that can later be elevated to a full "Always allow" permission.
    // You will be asked at a later point if you want to convert to "Always allow". The system waits until
    // you have started using the newly aquired permission before showing the permission dialog.
    //
    // Test the following scenarios in BareExpo -> APIs -> Location
    // ------------------------------------------------------------
    // (before tests, make sure to clear any location permissions and restart the app)
    //
    //   rfp = requestForegroundPermissionsAsync, fp: Actual foreground permission given
    //   rbp = requestBackgroundPermissionsAsync, bg: Actual background permission given
    //
    // - rfp -> "Allow once", then rbp -> no dialog                             = (fp: granted (temporary), bg: denied after 1.5 seconds)
    // - rfp -> "Allow while using App", then rbp -> "Keep only while using"    = (fp: granted, bg: denied)
    // - rfp -> "Allow while using App", then rbp -> "Change to always allow"   = (fp: granted, bg: granted)
    // - rfp -> "Don't allow", then rbp -> no dialog                            = (fp: denied, bg: denied)
    // - rbp -> "Allow once", no more dalogs                                    = (fp: granted (temporary), bg: denied)
    // - rbp -> "Allow while using App", no more dialogs                        = (fp: granted, bg: granted (provisional))
    // - rbp -> "Don't allow"                                                   = (fp: denied, bg: denied)
    
    // Save start statue and call requestLocationPermissions
    _beginStatus = [self.locationManager authorizationStatus];
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

- (void)locationManagerDidChangeAuthorization:(CLLocationManager *)manager
{
  CLAuthorizationStatus nextState = [manager authorizationStatus];
  if (_beginStatus == nextState && !_locationManagerWasCalled) {
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

#pragma mark - Helpers

+ (BOOL)isConfiguredForWhenInUseAuthorization
{
  return [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSLocationWhenInUseUsageDescription"] != nil;
}

+ (BOOL)isConfiguredForAlwaysAuthorization
{
  return [self isConfiguredForWhenInUseAuthorization] && [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSLocationAlwaysAndWhenInUseUsageDescription"];
}


@end
