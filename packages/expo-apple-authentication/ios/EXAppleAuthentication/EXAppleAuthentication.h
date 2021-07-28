// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXExportedModule.h>
#import <ExpoModulesCore/EXModuleRegistryConsumer.h>
#import <ExpoModulesCore/EXEventEmitter.h>
#import <ExpoModulesCore/EXEventEmitterService.h>

@import AuthenticationServices;

@interface EXAppleAuthentication : EXExportedModule <EXModuleRegistryConsumer, EXEventEmitter>

@end
