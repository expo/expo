// Copyright 2019-present 650 Industries. All rights reserved.

#import <ABI39_0_0UMPermissionsInterface/ABI39_0_0UMPermissionsInterface.h>

@interface ABI39_0_0EXUserFacingNotificationsPermissionsRequester : NSObject <ABI39_0_0UMPermissionsRequester>

- (instancetype)initWithMethodQueue:(dispatch_queue_t)methodQueue;

- (void)requestPermissions:(NSDictionary *)permissions
              withResolver:(ABI39_0_0UMPromiseResolveBlock)resolve
                  rejecter:(ABI39_0_0UMPromiseRejectBlock)reject;

@end
