// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI29_0_0EXCore/ABI29_0_0EXExportedModule.h>
#import <ABI29_0_0EXCore/ABI29_0_0EXModuleRegistryConsumer.h>

#import <ABI29_0_0EXCore/ABI29_0_0EXUIManager.h>
#import <ABI29_0_0EXFileSystemInterface/ABI29_0_0EXFileSystemInterface.h>

@interface ABI29_0_0EXGLObjectManager : ABI29_0_0EXExportedModule <ABI29_0_0EXModuleRegistryConsumer>

@property (nonatomic, weak) id<ABI29_0_0EXUIManager> uiManager;
@property (nonatomic, weak) id<ABI29_0_0EXFileSystemInterface> fileSystem;

- (void)saveContext:(nonnull id)glContext;
- (void)deleteContextWithId:(nonnull NSNumber *)contextId;

@end
