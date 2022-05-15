// Copyright 2015-present 650 Industries. All rights reserved.

#import <Photos/Photos.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXExportedModule.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXEventEmitter.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXModuleRegistryConsumer.h>

@interface ABI45_0_0EXMediaLibrary : ABI45_0_0EXExportedModule <ABI45_0_0EXModuleRegistryConsumer, PHPhotoLibraryChangeObserver, ABI45_0_0EXEventEmitter>

@end
