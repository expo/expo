// Copyright 2015-present 650 Industries. All rights reserved.

#import <Photos/Photos.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMExportedModule.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMEventEmitter.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMModuleRegistryConsumer.h>

@interface ABI35_0_0EXMediaLibrary : ABI35_0_0UMExportedModule <ABI35_0_0UMModuleRegistryConsumer, PHPhotoLibraryChangeObserver, ABI35_0_0UMEventEmitter>

@end
