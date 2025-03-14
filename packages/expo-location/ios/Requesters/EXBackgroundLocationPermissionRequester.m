// Copyright 2016-present 650 Industries. All rights reserved.

#import <ExpoLocation/EXBackgroundLocationPermissionRequester.h>

#import <objc/message.h>
#import <CoreLocation/CLLocationManagerDelegate.h>

static SEL alwaysAuthorizationSelector;

@interface EXBackgroundLocationPermissionRequester ()

@property (nonatomic, assign) bool wasAsked;

@end

@implementation EXBackgroundLocationPermissionRequester

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
  if ([EXBaseLocationRequester isConfiguredForAlwaysAuthorization] && [self.locationManager respondsToSelector:alwaysAuthorizationSelector]) {
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
  EXPermissionStatus status;

  switch (systemStatus) {
    case kCLAuthorizationStatusAuthorizedAlways: {
      status = EXPermissionStatusGranted;
      break;
    }
    case kCLAuthorizationStatusDenied:
    case kCLAuthorizationStatusRestricted: {
      status = EXPermissionStatusDenied;
      break;
    }
    case kCLAuthorizationStatusAuthorizedWhenInUse: {
      if (_wasAsked) {
        status = EXPermissionStatusDenied;
      } else {
        status = EXPermissionStatusUndetermined;
      }
      break;
    }
    case kCLAuthorizationStatusNotDetermined:
    default: {
      
      status = EXPermissionStatusUndetermined;
      break;
    }
  }
  
  return @{ @"status": @(status), @"scope": @(systemStatus == kCLAuthorizationStatusAuthorizedWhenInUse ? "whenInUse" : systemStatus == kCLAuthorizationStatusAuthorizedAlways ? "always" : "none") };
}

@end
