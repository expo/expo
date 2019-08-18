// Copyright 2015-present 650 Industries. All rights reserved.

#import <Photos/Photos.h>
#import <ABI31_0_0EXCore/ABI31_0_0EXExportedModule.h>
#import <ABI31_0_0EXCore/ABI31_0_0EXEventEmitter.h>
#import <ABI31_0_0EXCore/ABI31_0_0EXModuleRegistryConsumer.h>

@interface ABI31_0_0EXMediaLibrary : ABI31_0_0EXExportedModule <ABI31_0_0EXModuleRegistryConsumer, PHPhotoLibraryChangeObserver, ABI31_0_0EXEventEmitter>

@end
