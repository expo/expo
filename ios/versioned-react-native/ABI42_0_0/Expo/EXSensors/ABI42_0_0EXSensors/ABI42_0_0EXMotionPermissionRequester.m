// Copyright 2021-present 650 Industries. All rights reserved.

#import <ABI42_0_0EXSensors/ABI42_0_0EXMotionPermissionRequester.h>
#import <CoreMotion/CoreMotion.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMDefines.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMUtilities.h>

@implementation ABI42_0_0EXMotionPermissionRequester

+ (NSString *)permissionType
{
  return @"motion";
}

- (NSDictionary *)getPermissions
{
  ABI42_0_0EXPermissionStatus status;

  if (@available(iOS 11, *)) {
    NSString *motionUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSMotionUsageDescription"];
    // Related: NSFallDetectionUsageDescription
    if (!(motionUsageDescription)) {
      // TODO: Make aware of plugins, FYI link.
      ABI42_0_0UMFatal(ABI42_0_0UMErrorWithMessage(@"This app is missing the 'NSMotionUsageDescription' so CMPedometer services will fail. Ensure this key exist in the app's Info.plist."));
      status = ABI42_0_0EXPermissionStatusDenied;
    } else {
      switch ([CMPedometer authorizationStatus]) {
        case CMAuthorizationStatusAuthorized:
          status = ABI42_0_0EXPermissionStatusGranted;
          break;
        case CMAuthorizationStatusDenied:
        case CMAuthorizationStatusRestricted:
          status = ABI42_0_0EXPermissionStatusDenied;
          break;
        case CMAuthorizationStatusNotDetermined:
          status = ABI42_0_0EXPermissionStatusUndetermined;
          break;
      }
    }
  } else {
    status = ABI42_0_0EXPermissionStatusUndetermined;
  }
 
  return @{
    @"status": @(status)
  };
}

- (void)requestPermissionsWithResolver:(ABI42_0_0UMPromiseResolveBlock)resolve rejecter:(ABI42_0_0UMPromiseRejectBlock)reject
{
  CMPedometer *manager = [CMPedometer new];
  NSDate *today = [[NSDate alloc] init];
   
  ABI42_0_0UM_WEAKIFY(self)
  [manager queryPedometerDataFromDate:today toDate:today withHandler:^(CMPedometerData * _Nullable pedometerData, NSError * _Nullable error) {
    ABI42_0_0UM_STRONGIFY(self)
    [manager stopPedometerUpdates];
    resolve([self getPermissions]);
  }];
}

@end
