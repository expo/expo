// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI41_0_0UMCore/ABI41_0_0UMExportedModule.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMModuleRegistryConsumer.h>

#import <ABI41_0_0UMCore/ABI41_0_0UMUIManager.h>
#import <ABI41_0_0UMFileSystemInterface/ABI41_0_0UMFileSystemInterface.h>

@interface ABI41_0_0EXGLObjectManager : ABI41_0_0UMExportedModule <ABI41_0_0UMModuleRegistryConsumer>

@property (nonatomic, weak, nullable) id<ABI41_0_0UMUIManager> uiManager;
@property (nonatomic, weak, nullable) id<ABI41_0_0UMFileSystemInterface> fileSystem;

- (void)saveContext:(nonnull id)glContext;
- (void)deleteContextWithId:(nonnull NSNumber *)contextId;

@end
