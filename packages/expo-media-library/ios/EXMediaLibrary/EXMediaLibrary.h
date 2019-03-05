// Copyright 2015-present 650 Industries. All rights reserved.

#import <Photos/Photos.h>
#import <UMCore/UMExportedModule.h>
#import <UMCore/UMEventEmitter.h>
#import <UMCore/UMModuleRegistryConsumer.h>

@interface EXMediaLibrary : UMExportedModule <UMModuleRegistryConsumer, PHPhotoLibraryChangeObserver, UMEventEmitter>

@end
