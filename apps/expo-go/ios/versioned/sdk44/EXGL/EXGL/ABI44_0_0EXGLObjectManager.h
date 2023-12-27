// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXExportedModule.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXModuleRegistryConsumer.h>

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXUIManager.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXFileSystemInterface.h>

@interface ABI44_0_0EXGLObjectManager : ABI44_0_0EXExportedModule <ABI44_0_0EXModuleRegistryConsumer>

@property (nonatomic, weak, nullable) id<ABI44_0_0EXUIManager> uiManager;
@property (nonatomic, weak, nullable) id<ABI44_0_0EXFileSystemInterface> fileSystem;

- (void)saveContext:(nonnull id)glContext;
- (void)deleteContextWithId:(nonnull NSNumber *)contextId;

@end
