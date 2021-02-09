// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI38_0_0UMCore/ABI38_0_0UMExportedModule.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMModuleRegistryConsumer.h>

#import <ABI38_0_0UMCore/ABI38_0_0UMUIManager.h>
#import <ABI38_0_0UMFileSystemInterface/ABI38_0_0UMFileSystemInterface.h>

@interface ABI38_0_0EXGLObjectManager : ABI38_0_0UMExportedModule <ABI38_0_0UMModuleRegistryConsumer>

@property (nonatomic, weak, nullable) id<ABI38_0_0UMUIManager> uiManager;
@property (nonatomic, weak, nullable) id<ABI38_0_0UMFileSystemInterface> fileSystem;

- (void)saveContext:(nonnull id)glContext;
- (void)deleteContextWithId:(nonnull NSNumber *)contextId;

@end
