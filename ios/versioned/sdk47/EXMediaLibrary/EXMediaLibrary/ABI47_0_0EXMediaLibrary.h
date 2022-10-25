// Copyright 2015-present 650 Industries. All rights reserved.

#import <Photos/Photos.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXExportedModule.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXEventEmitter.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXModuleRegistryConsumer.h>

@interface ABI47_0_0EXMediaLibrary : ABI47_0_0EXExportedModule <ABI47_0_0EXModuleRegistryConsumer, PHPhotoLibraryChangeObserver, ABI47_0_0EXEventEmitter>

@end
