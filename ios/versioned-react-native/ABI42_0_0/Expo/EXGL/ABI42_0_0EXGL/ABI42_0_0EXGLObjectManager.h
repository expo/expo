// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI42_0_0UMCore/ABI42_0_0UMExportedModule.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMModuleRegistryConsumer.h>

#import <ABI42_0_0UMCore/ABI42_0_0UMUIManager.h>
#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXFileSystemInterface.h>

@interface ABI42_0_0EXGLObjectManager : ABI42_0_0UMExportedModule <ABI42_0_0UMModuleRegistryConsumer>

@property (nonatomic, weak, nullable) id<ABI42_0_0UMUIManager> uiManager;
@property (nonatomic, weak, nullable) id<ABI42_0_0EXFileSystemInterface> fileSystem;

- (void)saveContext:(nonnull id)glContext;
- (void)deleteContextWithId:(nonnull NSNumber *)contextId;

@end
