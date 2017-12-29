// Copyright 2016-present 650 Industries. All rights reserved.

#import <React/RCTBridgeModule.h>

FOUNDATION_EXPORT NSString * const EXPermissionExpiresNever;

typedef enum EXPermissionStatus {
  EXPermissionStatusDenied,
  EXPermissionStatusGranted,
  EXPermissionStatusUndetermined,
} EXPermissionStatus;

@protocol EXPermissionRequester <NSObject>

- (void)setDelegate:(id)permissionRequesterDelegate;
- (void)requestPermissionsWithResolver:(RCTPromiseResolveBlock)resolve
                              rejecter:(RCTPromiseRejectBlock)reject;

@end

@protocol EXPermissionRequesterDelegate <NSObject>

- (void)permissionRequesterDidFinish: (NSObject<EXPermissionRequester> *)requester;

@end

@interface EXPermissions : NSObject <RCTBridgeModule, EXPermissionRequesterDelegate>

+ (NSString *)permissionStringForStatus:(EXPermissionStatus)status;

+ (EXPermissionStatus)statusForPermissions:(NSDictionary *)permissions;

@end
