// Copyright 2015-present 650 Industries. All rights reserved.

#import <Photos/Photos.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXExportedModule.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXEventEmitter.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXModuleRegistryConsumer.h>

@interface ABI46_0_0EXMediaLibrary : ABI46_0_0EXExportedModule <ABI46_0_0EXModuleRegistryConsumer, PHPhotoLibraryChangeObserver, ABI46_0_0EXEventEmitter>

@end
