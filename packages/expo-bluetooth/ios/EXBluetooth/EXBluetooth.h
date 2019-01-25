// Copyright 2019-present 650 Industries. All rights reserved.

#import <EXCore/EXExportedModule.h>
#import <EXCore/EXEventEmitter.h>
#import <EXCore/EXModuleRegistryConsumer.h>
#import <CoreBluetooth/CoreBluetooth.h>

@interface EXBluetooth : EXExportedModule <EXModuleRegistryConsumer, EXEventEmitter>

@end
