// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI30_0_0EXCore/ABI30_0_0EXExportedModule.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXModuleRegistryConsumer.h>

#import <ABI30_0_0EXCore/ABI30_0_0EXUIManager.h>
#import <ABI30_0_0EXFileSystemInterface/ABI30_0_0EXFileSystemInterface.h>

@interface ABI30_0_0EXGLObjectManager : ABI30_0_0EXExportedModule <ABI30_0_0EXModuleRegistryConsumer>

@property (nonatomic, weak) id<ABI30_0_0EXUIManager> uiManager;
@property (nonatomic, weak) id<ABI30_0_0EXFileSystemInterface> fileSystem;

- (void)saveContext:(nonnull id)glContext;
- (void)deleteContextWithId:(nonnull NSNumber *)contextId;

@end
