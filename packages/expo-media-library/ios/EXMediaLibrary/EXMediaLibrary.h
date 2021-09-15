// Copyright 2015-present 650 Industries. All rights reserved.

#import <Photos/Photos.h>
#import <ExpoModulesCore/EXExportedModule.h>
#import <ExpoModulesCore/EXEventEmitter.h>
#import <ExpoModulesCore/EXModuleRegistryConsumer.h>

@interface EXMediaLibrary : EXExportedModule <EXModuleRegistryConsumer, PHPhotoLibraryChangeObserver, EXEventEmitter>

@end
