// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI33_0_0UMCore/ABI33_0_0UMExportedModule.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMModuleRegistryConsumer.h>

#import <ABI33_0_0UMCore/ABI33_0_0UMUIManager.h>
#import <ABI33_0_0UMFileSystemInterface/ABI33_0_0UMFileSystemInterface.h>

@interface ABI33_0_0EXGLObjectManager : ABI33_0_0UMExportedModule <ABI33_0_0UMModuleRegistryConsumer>

@property (nonatomic, weak) id<ABI33_0_0UMUIManager> uiManager;
@property (nonatomic, weak) id<ABI33_0_0UMFileSystemInterface> fileSystem;

- (void)saveContext:(nonnull id)glContext;
- (void)deleteContextWithId:(nonnull NSNumber *)contextId;

@end
