// Copyright 2015-present 650 Industries. All rights reserved.

#import <Photos/Photos.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMExportedModule.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMEventEmitter.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMModuleRegistryConsumer.h>

@interface ABI37_0_0EXMediaLibrary : ABI37_0_0UMExportedModule <ABI37_0_0UMModuleRegistryConsumer, PHPhotoLibraryChangeObserver, ABI37_0_0UMEventEmitter>

@end
