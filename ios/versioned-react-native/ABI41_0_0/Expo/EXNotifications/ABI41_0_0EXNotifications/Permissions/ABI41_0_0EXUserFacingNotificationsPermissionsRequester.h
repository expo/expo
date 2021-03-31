// Copyright 2019-present 650 Industries. All rights reserved.

#import <ABI41_0_0UMPermissionsInterface/ABI41_0_0UMPermissionsInterface.h>

@interface ABI41_0_0EXUserFacingNotificationsPermissionsRequester : NSObject <ABI41_0_0UMPermissionsRequester>

- (instancetype)initWithMethodQueue:(dispatch_queue_t)methodQueue;

- (void)requestPermissions:(NSDictionary *)permissions
              withResolver:(ABI41_0_0UMPromiseResolveBlock)resolve
                  rejecter:(ABI41_0_0UMPromiseRejectBlock)reject;

+ (void)setRequestedPermissions:(NSDictionary *)permissions;

@end
