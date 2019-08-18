// Copyright 2015-present 650 Industries. All rights reserved.

#import <Photos/Photos.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXExportedModule.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXEventEmitter.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXModuleRegistryConsumer.h>

@interface ABI32_0_0EXMediaLibrary : ABI32_0_0EXExportedModule <ABI32_0_0EXModuleRegistryConsumer, PHPhotoLibraryChangeObserver, ABI32_0_0EXEventEmitter>

@end
