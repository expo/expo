// Copyright 2019-present 650 Industries. All rights reserved.

#import <ABI38_0_0UMPermissionsInterface/ABI38_0_0UMPermissionsInterface.h>

@interface ABI38_0_0EXUserFacingNotificationsPermissionsRequester : NSObject <ABI38_0_0UMPermissionsRequester>

- (instancetype)initWithMethodQueue:(dispatch_queue_t)methodQueue;

- (void)requestPermissions:(NSDictionary *)permissions
              withResolver:(ABI38_0_0UMPromiseResolveBlock)resolve
                  rejecter:(ABI38_0_0UMPromiseRejectBlock)reject;

@end
