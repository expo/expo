// Copyright 2015-present 650 Industries. All rights reserved.

#import <Photos/Photos.h>
#import <EXCore/EXExportedModule.h>
#import <EXCore/EXEventEmitter.h>
#import <EXCore/EXModuleRegistryConsumer.h>

@interface EXMediaLibrary : EXExportedModule <EXModuleRegistryConsumer, PHPhotoLibraryChangeObserver, EXEventEmitter>

@end
