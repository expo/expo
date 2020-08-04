// Copyright 2015-present 650 Industries. All rights reserved.

#import <Photos/Photos.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMExportedModule.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMEventEmitter.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMModuleRegistryConsumer.h>

@interface ABI38_0_0EXMediaLibrary : ABI38_0_0UMExportedModule <ABI38_0_0UMModuleRegistryConsumer, PHPhotoLibraryChangeObserver, ABI38_0_0UMEventEmitter>

@end
