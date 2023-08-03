// Copyright 2015-present 650 Industries. All rights reserved.

#import <Photos/Photos.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXExportedModule.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXEventEmitter.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXModuleRegistryConsumer.h>

@interface ABI49_0_0EXMediaLibrary : ABI49_0_0EXExportedModule <ABI49_0_0EXModuleRegistryConsumer, PHPhotoLibraryChangeObserver, ABI49_0_0EXEventEmitter>

@end
