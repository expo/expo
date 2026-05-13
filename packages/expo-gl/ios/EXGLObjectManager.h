// Copyright 2016-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXCameraInterface.h>

@interface EXGLObjectManager : NSObject

@property (class, nonnull, nonatomic, strong) EXGLObjectManager *shared;

- (void)saveContext:(nonnull id)glContext;
- (void)deleteContextWithId:(nonnull NSNumber *)contextId;

- (void)takeSnapshotWithContextId:(nonnull NSNumber *)exglCtxId
                       andOptions:(nonnull NSDictionary *)options
                         resolver:(nonnull EXPromiseResolveBlock)resolve
                         rejecter:(nonnull EXPromiseRejectBlock)reject;

- (void)destroyContextWithId:(nonnull NSNumber *)exglCtxId
                     resolve:(nonnull EXPromiseResolveBlock)resolve
                      reject:(nonnull EXPromiseRejectBlock)reject;

- (void)destroyObjectAsync:(nonnull NSNumber *)exglObjId
                   resolve:(nonnull EXPromiseResolveBlock)resolve
                    reject:(nonnull EXPromiseRejectBlock)reject;

- (void)createTextureForContextWithId:(nonnull NSNumber *)exglCtxId
                           cameraView:(nonnull id<EXCameraInterface>)cameraView
                             resolver:(nonnull EXPromiseResolveBlock)resolve
                             rejecter:(nonnull EXPromiseRejectBlock)reject;

@end
