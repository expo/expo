// Copyright 2015-present 650 Industries. All rights reserved.

#import <Photos/Photos.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXExportedModule.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXEventEmitter.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXModuleRegistryConsumer.h>

@interface ABI44_0_0EXMediaLibrary : ABI44_0_0EXExportedModule <ABI44_0_0EXModuleRegistryConsumer, PHPhotoLibraryChangeObserver, ABI44_0_0EXEventEmitter>

@end
