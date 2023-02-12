// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXExportedModule.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXModuleRegistryConsumer.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXEventEmitter.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXEventEmitterService.h>

@import AuthenticationServices;

@interface ABI46_0_0EXAppleAuthentication : ABI46_0_0EXExportedModule <ABI46_0_0EXModuleRegistryConsumer, ABI46_0_0EXEventEmitter>

@end
