// Copyright 2021-present 650 Industries. All rights reserved.

#import <EXSensors/EXMotionPermissionRequester.h>
#import <CoreMotion/CoreMotion.h>
#import <UMCore/UMDefines.h>
#import <UMCore/UMUtilities.h>

@implementation EXMotionPermissionRequester

+ (NSString *)permissionType
{
  return @"motion";
}

- (NSDictionary *)getPermissions
{
  EXPermissionStatus status;

  if (@available(iOS 11, *)) {
    NSString *motionUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSMotionUsageDescription"];
    // Related: NSFallDetectionUsageDescription
    if (!(motionUsageDescription)) {
      // TODO: Make aware of plugins, FYI link.
      UMFatal(UMErrorWithMessage(@"This app is missing the 'NSMotionUsageDescription' so CMPedometer services will fail. Ensure this key exist in the app's Info.plist."));
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
  } else {
    status = EXPermissionStatusUndetermined;
  }
 
  return @{
    @"status": @(status)
  };
}

- (void)requestPermissionsWithResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject
{
  CMPedometer *manager = [CMPedometer new];
  NSDate *today = [[NSDate alloc] init];
   
  UM_WEAKIFY(self)
  [manager queryPedometerDataFromDate:today toDate:today withHandler:^(CMPedometerData * _Nullable pedometerData, NSError * _Nullable error) {
    UM_STRONGIFY(self)
    [manager stopPedometerUpdates];
    resolve([self getPermissions]);
  }];
}

@end
