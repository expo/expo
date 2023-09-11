// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXExportedModule.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXModuleRegistryConsumer.h>

#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXUIManager.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXFileSystemInterface.h>

@interface ABI47_0_0EXGLObjectManager : ABI47_0_0EXExportedModule <ABI47_0_0EXModuleRegistryConsumer>

@property (nonatomic, weak, nullable) id<ABI47_0_0EXUIManager> uiManager;
@property (nonatomic, weak, nullable) id<ABI47_0_0EXFileSystemInterface> fileSystem;

- (void)saveContext:(nonnull id)glContext;
- (void)deleteContextWithId:(nonnull NSNumber *)contextId;

@end
