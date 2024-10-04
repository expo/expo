// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXExportedModule.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXModuleRegistryConsumer.h>

#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXUIManager.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXFileSystemInterface.h>

@interface ABI48_0_0EXGLObjectManager : ABI48_0_0EXExportedModule <ABI48_0_0EXModuleRegistryConsumer>

@property (nonatomic, weak, nullable) id<ABI48_0_0EXUIManager> uiManager;
@property (nonatomic, weak, nullable) id<ABI48_0_0EXFileSystemInterface> fileSystem;

- (void)saveContext:(nonnull id)glContext;
- (void)deleteContextWithId:(nonnull NSNumber *)contextId;

@end
