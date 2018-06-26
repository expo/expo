// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXCore/EXExportedModule.h>
#import <EXCore/EXModuleRegistryConsumer.h>

#import <EXCore/EXUIManager.h>
#import <EXFileSystemInterface/EXFileSystemInterface.h>

@interface EXGLObjectManager : EXExportedModule <EXModuleRegistryConsumer>

@property (nonatomic, weak) id<EXUIManager> uiManager;
@property (nonatomic, weak) id<EXFileSystemInterface> fileSystem;

- (void)saveContext:(nonnull id)glContext;
- (void)deleteContextWithId:(nonnull NSNumber *)contextId;

@end
