// Copyright 2015-present 650 Industries. All rights reserved.

#import <Photos/Photos.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXExportedModule.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXEventEmitter.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXModuleRegistryConsumer.h>

@interface ABI30_0_0EXMediaLibrary : ABI30_0_0EXExportedModule <ABI30_0_0EXModuleRegistryConsumer, PHPhotoLibraryChangeObserver, ABI30_0_0EXEventEmitter>

@end
