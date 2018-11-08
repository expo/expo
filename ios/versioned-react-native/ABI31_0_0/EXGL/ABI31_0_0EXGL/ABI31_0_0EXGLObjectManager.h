// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI31_0_0EXCore/ABI31_0_0EXExportedModule.h>
#import <ABI31_0_0EXCore/ABI31_0_0EXModuleRegistryConsumer.h>

#import <ABI31_0_0EXCore/ABI31_0_0EXUIManager.h>
#import <ABI31_0_0EXFileSystemInterface/ABI31_0_0EXFileSystemInterface.h>

@interface ABI31_0_0EXGLObjectManager : ABI31_0_0EXExportedModule <ABI31_0_0EXModuleRegistryConsumer>

@property (nonatomic, weak) id<ABI31_0_0EXUIManager> uiManager;
@property (nonatomic, weak) id<ABI31_0_0EXFileSystemInterface> fileSystem;

- (void)saveContext:(nonnull id)glContext;
- (void)deleteContextWithId:(nonnull NSNumber *)contextId;

@end
