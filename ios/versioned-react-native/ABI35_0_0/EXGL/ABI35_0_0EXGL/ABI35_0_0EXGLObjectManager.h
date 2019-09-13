// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI35_0_0UMCore/ABI35_0_0UMExportedModule.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMModuleRegistryConsumer.h>

#import <ABI35_0_0UMCore/ABI35_0_0UMUIManager.h>
#import <ABI35_0_0UMFileSystemInterface/ABI35_0_0UMFileSystemInterface.h>

@interface ABI35_0_0EXGLObjectManager : ABI35_0_0UMExportedModule <ABI35_0_0UMModuleRegistryConsumer>

@property (nonatomic, weak, nullable) id<ABI35_0_0UMUIManager> uiManager;
@property (nonatomic, weak, nullable) id<ABI35_0_0UMFileSystemInterface> fileSystem;

- (void)saveContext:(nonnull id)glContext;
- (void)deleteContextWithId:(nonnull NSNumber *)contextId;

@end
