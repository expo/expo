// Copyright 2016-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXExportedModule.h>
#import <ExpoModulesCore/EXModuleRegistryConsumer.h>

#import <ExpoModulesCore/EXUIManager.h>
#import <ExpoModulesCore/EXFileSystemInterface.h>

@interface EXGLObjectManager : EXExportedModule <EXModuleRegistryConsumer>

@property (nonatomic, weak, nullable) id<EXUIManager> uiManager;
@property (nonatomic, weak, nullable) id<EXFileSystemInterface> fileSystem;

- (void)saveContext:(nonnull id)glContext;
- (void)deleteContextWithId:(nonnull NSNumber *)contextId;

@end
