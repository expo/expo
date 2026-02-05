// Copyright 2021-present 650 Industries. All rights reserved.

#import <ExpoSensors/EXMotionPermissionRequester.h>
#import <CoreMotion/CoreMotion.h>
#import <ExpoModulesCore/EXDefines.h>
#import <ExpoModulesCore/EXUtilities.h>
#import <React/RCTLog.h>

@implementation EXMotionPermissionRequester

+ (NSString *)permissionType
{
  return @"motion";
}

- (NSDictionary *)getPermissions
{
  EXPermissionStatus status;

#ifdef EXPO_DISABLE_MOTION_PERMISSION
  status = EXPermissionStatusDenied;
  RCTErrorWithMessage(@"This app has disabled `motionPermission` through the config plugin options so CMPedometer services will fail.");
#else
    NSString *motionUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSMotionUsageDescription"];
    // Related: NSFallDetectionUsageDescription
    if (!(motionUsageDescription)) {
      // TODO: Make aware of plugins, FYI link.
      RCTFatal(RCTErrorWithMessage(@"This app is missing the 'NSMotionUsageDescription' so CMPedometer services will fail. Ensure this key exist in the app's Info.plist."));
      status = EXPermissionStatusDenied;
    } else {
      switch ([CMPedometer authorizationStatus]) {
        case CMAuthorizationStatusAuthorized:
          status = EXPermissionStatusGranted;
          break;
        case CMAuthorizationStatusDenied:
        case CMAuthorizationStatusRestricted:
          status = EXPermissionStatusDenied;
          break;
        case CMAuthorizationStatusNotDetermined:
          status = EXPermissionStatusUndetermined;
          break;
      }
    }
#endif

  return @{
    @"status": @(status)
  };
}

- (void)requestPermissionsWithResolver:(EXPromiseResolveBlock)resolve rejecter:(EXPromiseRejectBlock)reject
{
#ifdef EXPO_DISABLE_MOTION_PERMISSION
  resolve([self getPermissions]);
#else
  CMPedometer *manager = [CMPedometer new];
  NSDate *today = [[NSDate alloc] init];
   
  EX_WEAKIFY(self)
  [manager queryPedometerDataFromDate:today toDate:today withHandler:^(CMPedometerData * _Nullable pedometerData, NSError * _Nullable error) {
    EX_STRONGIFY(self)
    [manager stopPedometerUpdates];
    resolve([self getPermissions]);
  }];
#endif
}

@end
