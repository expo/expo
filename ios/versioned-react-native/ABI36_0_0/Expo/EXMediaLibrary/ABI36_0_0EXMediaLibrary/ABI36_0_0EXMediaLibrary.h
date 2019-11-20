// Copyright 2015-present 650 Industries. All rights reserved.

#import <Photos/Photos.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMExportedModule.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMEventEmitter.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMModuleRegistryConsumer.h>

@interface ABI36_0_0EXMediaLibrary : ABI36_0_0UMExportedModule <ABI36_0_0UMModuleRegistryConsumer, PHPhotoLibraryChangeObserver, ABI36_0_0UMEventEmitter>

@end
