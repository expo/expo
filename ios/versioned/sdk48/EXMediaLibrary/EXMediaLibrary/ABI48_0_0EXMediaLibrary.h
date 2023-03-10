// Copyright 2015-present 650 Industries. All rights reserved.

#import <Photos/Photos.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXExportedModule.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXEventEmitter.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXModuleRegistryConsumer.h>

@interface ABI48_0_0EXMediaLibrary : ABI48_0_0EXExportedModule <ABI48_0_0EXModuleRegistryConsumer, PHPhotoLibraryChangeObserver, ABI48_0_0EXEventEmitter>

@end
