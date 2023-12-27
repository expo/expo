// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXExportedModule.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXModuleRegistryConsumer.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXEventEmitter.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXEventEmitterService.h>

@import AuthenticationServices;

@interface ABI43_0_0EXAppleAuthentication : ABI43_0_0EXExportedModule <ABI43_0_0EXModuleRegistryConsumer, ABI43_0_0EXEventEmitter>

@end
