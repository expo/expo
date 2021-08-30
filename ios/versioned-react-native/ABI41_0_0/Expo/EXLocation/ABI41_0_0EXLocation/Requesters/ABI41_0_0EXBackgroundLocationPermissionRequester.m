// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI41_0_0EXLocation/ABI41_0_0EXBackgroundLocationPermissionRequester.h>

#import <objc/message.h>
#import <CoreLocation/CLLocationManagerDelegate.h>

static SEL alwaysAuthorizationSelector;

@interface ABI41_0_0EXBackgroundLocationPermissionRequester ()

@property (nonatomic, assign) bool wasAsked;

@end

@implementation ABI41_0_0EXBackgroundLocationPermissionRequester

- (instancetype)init
{
  if (self = [super init]) {
    _wasAsked = false;
  }
  return self;
}

+ (NSString *)permissionType
{
  return @"locationBackground";
}

+ (void)load
{
  alwaysAuthorizationSelector = NSSelectorFromString([@"request" stringByAppendingString:@"AlwaysAuthorization"]);
}

- (void)requestLocationPermissions
{
  if ([ABI41_0_0EXBaseLocationRequester isConfiguredForAlwaysAuthorization] && [self.locationManager respondsToSelector:alwaysAuthorizationSelector]) {
    _wasAsked = true;
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleAppBecomingActive)
                                                 name:UIApplicationDidBecomeActiveNotification
                                               object:nil];
    ((void (*)(id, SEL))objc_msgSend)(self.locationManager, alwaysAuthorizationSelector);
  } else {
    self.reject(@"ERR_LOCATION_INFO_PLIST", @"One of the `NSLocation*UsageDescription` keys must be present in Info.plist to be able to use geolocation.", nil);
    
    self.resolve = nil;
    self.reject = nil;
  }
}

// If user selects "Keep Only While Using" option, the `locationManagerDidChangeAuthorization` won't be called.
// So we don't know when we should resolve promise.
// Hovewer, we can check for `UIApplicationDidBecomeActiveNotification` event which is called when permissions modal disappears.
- (void)handleAppBecomingActive
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  if (self.resolve) {
    self.resolve([self getPermissions]);
    self.resolve = nil;
    self.reject = nil;
  }
}

- (NSDictionary *)parsePermissions:(CLAuthorizationStatus)systemStatus
{
  ABI41_0_0UMPermissionStatus status;

  switch (systemStatus) {
    case kCLAuthorizationStatusAuthorizedAlways: {
      status = ABI41_0_0UMPermissionStatusGranted;
      break;
    }
    case kCLAuthorizationStatusDenied:
    case kCLAuthorizationStatusRestricted: {
      status = ABI41_0_0UMPermissionStatusDenied;
      break;
    }
    case kCLAuthorizationStatusAuthorizedWhenInUse: {
      if (_wasAsked) {
        status = ABI41_0_0UMPermissionStatusDenied;
      } else {
        status = ABI41_0_0UMPermissionStatusUndetermined;
      }
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
