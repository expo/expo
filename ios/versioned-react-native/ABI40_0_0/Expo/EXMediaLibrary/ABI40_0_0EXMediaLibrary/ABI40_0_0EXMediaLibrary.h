// Copyright 2015-present 650 Industries. All rights reserved.

#import <Photos/Photos.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMExportedModule.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMEventEmitter.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMModuleRegistryConsumer.h>

@interface ABI40_0_0EXMediaLibrary : ABI40_0_0UMExportedModule <ABI40_0_0UMModuleRegistryConsumer, PHPhotoLibraryChangeObserver, ABI40_0_0UMEventEmitter>

@end
