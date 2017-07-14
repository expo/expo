// Copyright 2016-present 650 Industries. All rights reserved.

#import <ReactABI19_0_0/ABI19_0_0RCTBridgeModule.h>

FOUNDATION_EXPORT NSString * const ABI19_0_0EXPermissionExpiresNever;

typedef enum ABI19_0_0EXPermissionStatus {
  ABI19_0_0EXPermissionStatusDenied,
  ABI19_0_0EXPermissionStatusGranted,
  ABI19_0_0EXPermissionStatusUndetermined,
} ABI19_0_0EXPermissionStatus;

@protocol ABI19_0_0EXPermissionRequester <NSObject>

- (void)setDelegate:(id)permissionRequesterDelegate;
- (void)requestPermissionsWithResolver:(ABI19_0_0RCTPromiseResolveBlock)resolve
                              rejecter:(ABI19_0_0RCTPromiseRejectBlock)reject;

@end

@protocol ABI19_0_0EXPermissionRequesterDelegate <NSObject>

- (void)permissionRequesterDidFinish: (NSObject<ABI19_0_0EXPermissionRequester> *)requester;

@end

@interface ABI19_0_0EXPermissions : NSObject <ABI19_0_0RCTBridgeModule, ABI19_0_0EXPermissionRequesterDelegate>

+ (NSString *)permissionStringForStatus:(ABI19_0_0EXPermissionStatus)status;

+ (ABI19_0_0EXPermissionStatus)statusForPermissions:(NSDictionary *)permissions;

@end
