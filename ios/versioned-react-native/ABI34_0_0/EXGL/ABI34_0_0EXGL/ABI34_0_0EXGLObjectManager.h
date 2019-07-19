// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI34_0_0UMCore/ABI34_0_0UMExportedModule.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMModuleRegistryConsumer.h>

#import <ABI34_0_0UMCore/ABI34_0_0UMUIManager.h>
#import <ABI34_0_0UMFileSystemInterface/ABI34_0_0UMFileSystemInterface.h>

@interface ABI34_0_0EXGLObjectManager : ABI34_0_0UMExportedModule <ABI34_0_0UMModuleRegistryConsumer>

@property (nonatomic, weak, nullable) id<ABI34_0_0UMUIManager> uiManager;
@property (nonatomic, weak, nullable) id<ABI34_0_0UMFileSystemInterface> fileSystem;

- (void)saveContext:(nonnull id)glContext;
- (void)deleteContextWithId:(nonnull NSNumber *)contextId;

@end
