// Copyright 2016-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UMCore/UMExportedModule.h>

@class EXPermissions; // forward declaration 

@protocol EXPermissionRequester <NSObject>

- (instancetype)initWithPermissionsModule:(EXPermissions *)permissionsModule;

- (void)requestPermissionsWithResolver:(UMPromiseResolveBlock)resolve

                              rejecter:(UMPromiseRejectBlock)reject;

- (NSDictionary *)permissions;

@end
