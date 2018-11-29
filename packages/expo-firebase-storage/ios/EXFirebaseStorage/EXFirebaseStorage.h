// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <FirebaseStorage/FIRStorage.h>
#import <EXCore/EXModuleRegistry.h>
#import <EXCore/EXModuleRegistryConsumer.h>
#import <EXCore/EXEventEmitter.h>

@interface EXFirebaseStorage : EXExportedModule <EXModuleRegistryConsumer, EXEventEmitter>
@end
