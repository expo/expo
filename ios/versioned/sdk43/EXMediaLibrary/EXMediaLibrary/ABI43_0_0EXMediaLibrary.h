// Copyright 2015-present 650 Industries. All rights reserved.

#import <Photos/Photos.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXExportedModule.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXEventEmitter.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXModuleRegistryConsumer.h>

@interface ABI43_0_0EXMediaLibrary : ABI43_0_0EXExportedModule <ABI43_0_0EXModuleRegistryConsumer, PHPhotoLibraryChangeObserver, ABI43_0_0EXEventEmitter>

@end
