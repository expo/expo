// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI36_0_0UMCore/ABI36_0_0UMExportedModule.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMModuleRegistryConsumer.h>

#import <ABI36_0_0UMCore/ABI36_0_0UMUIManager.h>
#import <ABI36_0_0UMFileSystemInterface/ABI36_0_0UMFileSystemInterface.h>

@interface ABI36_0_0EXGLObjectManager : ABI36_0_0UMExportedModule <ABI36_0_0UMModuleRegistryConsumer>

@property (nonatomic, weak, nullable) id<ABI36_0_0UMUIManager> uiManager;
@property (nonatomic, weak, nullable) id<ABI36_0_0UMFileSystemInterface> fileSystem;

- (void)saveContext:(nonnull id)glContext;
- (void)deleteContextWithId:(nonnull NSNumber *)contextId;

@end
