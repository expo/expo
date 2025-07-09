// Copyright 2016-present 650 Industries. All rights reserved.

#import <ExpoLocation/EXBackgroundLocationPermissionRequester.h>

#import <objc/message.h>
#import <CoreLocation/CLLocationManagerDelegate.h>

static SEL alwaysAuthorizationSelector;

@interface EXBackgroundLocationPermissionRequester ()

@property (nonatomic, assign) bool wasAsked;
@property (nonatomic, assign) bool isWaitingForTimeout;

@end

@implementation EXBackgroundLocationPermissionRequester

- (instancetype)init
{
  if (self = [super init]) {
    _wasAsked = false;
    _isWaitingForTimeout = false;
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
    CLAuthorizationStatus status = [self.locationManager authorizationStatus];
    
    if (status == kCLAuthorizationStatusAuthorizedWhenInUse) {
      // We already have a foreground permission granted:
      // When asking for background location, we might or might not have asked for foreground permission
      // before we get here. An issue here is if the user has a temporary permission ("Allow once") - which
      // results in the status being "kCLAuthorizationStatusAuthorizedWhenInUse" - without us knowing.
      // We need to handle this special case which is not possible to detect through the API.
      // What we do is that we'll wait 1.5 seconds on an UIApplicationWillResignActiveNotification
      // notification (which will be emitted almost directly if the permission dialog is displayed). If the permission
      // dialog is not displayed we'll timeout and can resolve the waiting promise with an updated denied status.
      [[NSNotificationCenter defaultCenter] addObserver:self
                                               selector:@selector(handleAppBecomingInactive)
                                                   name:UIApplicationWillResignActiveNotification
                                                 object:nil];
      
      // Setup timeout - if no permission dialog was displayed we can just stop listening and deny
      // the request
      [self setupAppInactivateTimeout];
    }
    
    // Request permissions
    ((void (*)(id, SEL))objc_msgSend)(self.locationManager, alwaysAuthorizationSelector);
  } else {
    self.reject(@"ERR_LOCATION_INFO_PLIST", @"One of the `NSLocation*UsageDescription` keys must be present in Info.plist to be able to use geolocation.", nil);
    
    self.resolve = nil;
    self.reject = nil;
  }
}

- (void)handleAppBecomingActive
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  if (self.resolve) {
    self.resolve([self getPermissions]);
    self.resolve = nil;
    self.reject = nil;
  }
}

- (void)handleAppBecomingInactive
{
  // Let's wait until the app becomes inactive - this happens when OS displays the
  // permission dialog - then we can cancel the timeout handler.

  _isWaitingForTimeout = false;
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  
  // When the app is inactive it means that a permission dialog is showing and we should ask to be
  // notified when the dialog is closed:
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleAppBecomingActive)
                                               name:UIApplicationDidBecomeActiveNotification
                                             object:nil];
}

- (void)setupAppInactivateTimeout
{
  _isWaitingForTimeout = true;
  
  // Obtain a reference to the current queue
  dispatch_queue_t currentQueue = dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_BACKGROUND, 0);

  // Calculate the time for the delay
  dispatch_time_t delayTime = dispatch_time(DISPATCH_TIME_NOW, (int64_t)(1.5 * NSEC_PER_SEC));

  EX_WEAKIFY(self);
  
  // Schedule the block to be executed after the delay
  dispatch_after(delayTime, currentQueue, ^{
    EX_ENSURE_STRONGIFY(self)
    // Check if we are still waiting - ie. we haven't seen a permission dialog
    if (self.isWaitingForTimeout && self.resolve) {
      self.isWaitingForTimeout = false;
      self.resolve([self getPermissions]);
      self.resolve = nil;
      self.reject = nil;
    }
  });
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
