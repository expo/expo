// Copyright 2021-present 650 Industries. All rights reserved.

#import <ABI46_0_0EXSensors/ABI46_0_0EXMotionPermissionRequester.h>
#import <CoreMotion/CoreMotion.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXDefines.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXUtilities.h>

@implementation ABI46_0_0EXMotionPermissionRequester

+ (NSString *)permissionType
{
  return @"motion";
}

- (NSDictionary *)getPermissions
{
  ABI46_0_0EXPermissionStatus status;

  if (@available(iOS 11, *)) {
    NSString *motionUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSMotionUsageDescription"];
    // Related: NSFallDetectionUsageDescription
    if (!(motionUsageDescription)) {
      // TODO: Make aware of plugins, FYI link.
      ABI46_0_0EXFatal(ABI46_0_0EXErrorWithMessage(@"This app is missing the 'NSMotionUsageDescription' so CMPedometer services will fail. Ensure this key exist in the app's Info.plist."));
      status = ABI46_0_0EXPermissionStatusDenied;
    } else {
      switch ([CMPedometer authorizationStatus]) {
        case CMAuthorizationStatusAuthorized:
          status = ABI46_0_0EXPermissionStatusGranted;
          break;
        case CMAuthorizationStatusDenied:
        case CMAuthorizationStatusRestricted:
          status = ABI46_0_0EXPermissionStatusDenied;
          break;
        case CMAuthorizationStatusNotDetermined:
          status = ABI46_0_0EXPermissionStatusUndetermined;
          break;
      }
    }
  } else {
    status = ABI46_0_0EXPermissionStatusUndetermined;
  }
 
  return @{
    @"status": @(status)
  };
}

- (void)requestPermissionsWithResolver:(ABI46_0_0EXPromiseResolveBlock)resolve rejecter:(ABI46_0_0EXPromiseRejectBlock)reject
{
  CMPedometer *manager = [CMPedometer new];
  NSDate *today = [[NSDate alloc] init];
   
  ABI46_0_0EX_WEAKIFY(self)
  [manager queryPedometerDataFromDate:today toDate:today withHandler:^(CMPedometerData * _Nullable pedometerData, NSError * _Nullable error) {
    ABI46_0_0EX_STRONGIFY(self)
    [manager stopPedometerUpdates];
    resolve([self getPermissions]);
  }];
}

@end
