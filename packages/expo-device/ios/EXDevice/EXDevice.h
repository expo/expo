// Copyright 2019-present 650 Industries. All rights reserved.

#import <UMCore/UMExportedModule.h>
#import <Foundation/Foundation.h>
#import <UMCore/UMModuleRegistryConsumer.h>

@interface EXDevice : UMExportedModule <UMModuleRegistryConsumer>

@property (nonatomic) bool isEmulator;
@property (weak, nonatomic) UMModuleRegistry *moduleRegistry;

@end
