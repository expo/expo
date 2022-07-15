// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXExportedModule.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXEventEmitter.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXModuleRegistryConsumer.h>
#import <ABI46_0_0EXNotifications/ABI46_0_0EXPushTokenListener.h>

@interface ABI46_0_0EXPushTokenModule : ABI46_0_0EXExportedModule <ABI46_0_0EXEventEmitter, ABI46_0_0EXModuleRegistryConsumer, ABI46_0_0EXPushTokenListener>
@end
