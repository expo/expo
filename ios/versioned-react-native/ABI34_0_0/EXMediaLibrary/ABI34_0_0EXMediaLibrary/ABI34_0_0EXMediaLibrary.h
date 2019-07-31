// Copyright 2015-present 650 Industries. All rights reserved.

#import <Photos/Photos.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMExportedModule.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMEventEmitter.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMModuleRegistryConsumer.h>

@interface ABI34_0_0EXMediaLibrary : ABI34_0_0UMExportedModule <ABI34_0_0UMModuleRegistryConsumer, PHPhotoLibraryChangeObserver, ABI34_0_0UMEventEmitter>

@end
