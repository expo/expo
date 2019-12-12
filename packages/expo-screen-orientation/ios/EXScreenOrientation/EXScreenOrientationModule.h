//  Copyright © 2019-present 650 Industries. All rights reserved.

#import <UMCore/UMEventEmitter.h>
#import <UMCore/UMExportedModule.h>
#import <UMCore/UMModuleRegistryConsumer.h>
#import <UMScreenOrientationInterface/UMScreenOrientationInterface.h>

@interface EXScreenOrientationModule : UMExportedModule <UMModuleRegistryConsumer, UMEventEmitter, UMScreenOrientationInterface>

@end
