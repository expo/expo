// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI40_0_0UMCore/ABI40_0_0UMExportedModule.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMModuleRegistryConsumer.h>

#import <ABI40_0_0UMCore/ABI40_0_0UMUIManager.h>
#import <ABI40_0_0UMFileSystemInterface/ABI40_0_0UMFileSystemInterface.h>

@interface ABI40_0_0EXGLObjectManager : ABI40_0_0UMExportedModule <ABI40_0_0UMModuleRegistryConsumer>

@property (nonatomic, weak, nullable) id<ABI40_0_0UMUIManager> uiManager;
@property (nonatomic, weak, nullable) id<ABI40_0_0UMFileSystemInterface> fileSystem;

- (void)saveContext:(nonnull id)glContext;
- (void)deleteContextWithId:(nonnull NSNumber *)contextId;

@end
