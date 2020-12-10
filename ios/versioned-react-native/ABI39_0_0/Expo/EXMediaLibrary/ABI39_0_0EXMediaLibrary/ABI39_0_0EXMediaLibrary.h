// Copyright 2015-present 650 Industries. All rights reserved.

#import <Photos/Photos.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMExportedModule.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMEventEmitter.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMModuleRegistryConsumer.h>

@interface ABI39_0_0EXMediaLibrary : ABI39_0_0UMExportedModule <ABI39_0_0UMModuleRegistryConsumer, PHPhotoLibraryChangeObserver, ABI39_0_0UMEventEmitter>

@end
