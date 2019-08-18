// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI32_0_0EXCore/ABI32_0_0EXExportedModule.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXModuleRegistryConsumer.h>

#import <ABI32_0_0EXCore/ABI32_0_0EXUIManager.h>
#import <ABI32_0_0EXFileSystemInterface/ABI32_0_0EXFileSystemInterface.h>

@interface ABI32_0_0EXGLObjectManager : ABI32_0_0EXExportedModule <ABI32_0_0EXModuleRegistryConsumer>

@property (nonatomic, weak) id<ABI32_0_0EXUIManager> uiManager;
@property (nonatomic, weak) id<ABI32_0_0EXFileSystemInterface> fileSystem;

- (void)saveContext:(nonnull id)glContext;
- (void)deleteContextWithId:(nonnull NSNumber *)contextId;

@end
