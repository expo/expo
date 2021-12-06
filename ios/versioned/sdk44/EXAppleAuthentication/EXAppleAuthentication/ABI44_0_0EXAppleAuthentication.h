// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXExportedModule.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXModuleRegistryConsumer.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXEventEmitter.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXEventEmitterService.h>

@import AuthenticationServices;

@interface ABI44_0_0EXAppleAuthentication : ABI44_0_0EXExportedModule <ABI44_0_0EXModuleRegistryConsumer, ABI44_0_0EXEventEmitter>

@end
