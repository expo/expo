// Copyright 2015-present 650 Industries. All rights reserved.

#import <Photos/Photos.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMExportedModule.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMEventEmitter.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMModuleRegistryConsumer.h>

@interface ABI42_0_0EXMediaLibrary : ABI42_0_0UMExportedModule <ABI42_0_0UMModuleRegistryConsumer, PHPhotoLibraryChangeObserver, ABI42_0_0UMEventEmitter>

@end
