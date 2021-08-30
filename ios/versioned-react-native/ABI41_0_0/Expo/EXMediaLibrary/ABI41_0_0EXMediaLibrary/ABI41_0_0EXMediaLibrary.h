// Copyright 2015-present 650 Industries. All rights reserved.

#import <Photos/Photos.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMExportedModule.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMEventEmitter.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMModuleRegistryConsumer.h>

@interface ABI41_0_0EXMediaLibrary : ABI41_0_0UMExportedModule <ABI41_0_0UMModuleRegistryConsumer, PHPhotoLibraryChangeObserver, ABI41_0_0UMEventEmitter>

@end
