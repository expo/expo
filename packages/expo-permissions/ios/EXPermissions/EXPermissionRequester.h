// Copyright 2016-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UMCore/UMExportedModule.h>

@protocol EXPermissionRequester <NSObject>

- (void)setDelegate:(id)permissionRequesterDelegate;
- (void)requestPermissionsWithResolver:(UMPromiseResolveBlock)resolve
                              rejecter:(UMPromiseRejectBlock)reject;

@end

@protocol EXPermissionRequesterDelegate <NSObject>

- (void)permissionRequesterDidFinish:(NSObject<EXPermissionRequester> *)requester;

@end
