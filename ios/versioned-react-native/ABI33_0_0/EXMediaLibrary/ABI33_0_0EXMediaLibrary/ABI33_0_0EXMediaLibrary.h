// Copyright 2015-present 650 Industries. All rights reserved.

#import <Photos/Photos.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMExportedModule.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMEventEmitter.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMModuleRegistryConsumer.h>

@interface ABI33_0_0EXMediaLibrary : ABI33_0_0UMExportedModule <ABI33_0_0UMModuleRegistryConsumer, PHPhotoLibraryChangeObserver, ABI33_0_0UMEventEmitter>

@end
