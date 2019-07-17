// Copyright 2016-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UMCore/UMExportedModule.h>

@protocol EXPermissionRequester <NSObject>

- (void)setDelegate:(id)permissionRequesterDelegate;
- (void)requestPermissionsWithResolver:(UMPromiseResolveBlock)resolve
                              rejecter:(UMPromiseRejectBlock)reject;

@end

@protocol EXPermissionRequesterDelegate <NSObject>

- (void)permissionRequesterDidFinish: (NSObject<EXPermissionRequester> *)requester;

@end

@protocol EXPermissionsModule

- (dispatch_queue_t)methodQueue;

@end

@interface EXPermissionBaseRequester : NSObject<EXPermissionRequester>

@property (nonatomic, weak) id<EXPermissionRequesterDelegate> delegate;


@end
