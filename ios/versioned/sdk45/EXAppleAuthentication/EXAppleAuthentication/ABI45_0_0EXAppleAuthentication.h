// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXExportedModule.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXModuleRegistryConsumer.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXEventEmitter.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXEventEmitterService.h>

@import AuthenticationServices;

@interface ABI45_0_0EXAppleAuthentication : ABI45_0_0EXExportedModule <ABI45_0_0EXModuleRegistryConsumer, ABI45_0_0EXEventEmitter>

@end
