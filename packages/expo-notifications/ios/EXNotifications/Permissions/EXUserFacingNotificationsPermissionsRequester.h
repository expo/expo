// Copyright 2019-present 650 Industries. All rights reserved.

#import <UMPermissionsInterface/UMPermissionsInterface.h>

@interface EXUserFacingNotificationsPermissionsRequester : NSObject <UMPermissionsRequester>

- (instancetype)initWithMethodQueue:(dispatch_queue_t)methodQueue;

- (void)requestPermissions:(NSDictionary *)permissions
              withResolver:(UMPromiseResolveBlock)resolve
                  rejecter:(UMPromiseRejectBlock)reject;

@end
