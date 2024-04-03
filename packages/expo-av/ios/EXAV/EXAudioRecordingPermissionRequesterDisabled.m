// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXAV/EXAudioRecordingPermissionRequester.h>
#import <ExpoModulesCore/EXDefines.h>

@implementation EXAudioRecordingPermissionRequester

+ (NSString *)permissionType
{
  return @"audioRecording";
}

- (NSDictionary *)getPermissions
{
  EXPermissionStatus status = EXPermissionStatusDenied;

  return @{
    @"status": @(status)
  };
}

- (void)requestPermissionsWithResolver:(EXPromiseResolveBlock)resolve rejecter:(EXPromiseRejectBlock)reject
{
  resolve([self getPermissions]);
}

@end
