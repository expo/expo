// Copyright 2016-present 650 Industries. All rights reserved.

#import <UMCore/UMExportedModule.h>
#import <UMCore/UMModuleRegistryConsumer.h>

#import <UMCore/UMUIManager.h>
#import <UMFileSystemInterface/UMFileSystemInterface.h>
#import <EXGL/EXGLCameraObject.h>

@interface EXGLObjectManager : UMExportedModule <UMModuleRegistryConsumer>

@property (nonatomic, weak, nullable) id<UMUIManager> uiManager;
@property (nonatomic, weak, nullable) id<UMFileSystemInterface> fileSystem;
@property (nonatomic, weak, nullable) EXGLCameraObject *cameraTexture;

- (void)saveContext:(nonnull id)glContext;
- (void)deleteContextWithId:(nonnull NSNumber *)contextId;

@end
