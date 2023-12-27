// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXExportedModule.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXEventEmitter.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXModuleRegistryConsumer.h>
#import <ABI44_0_0EXNotifications/ABI44_0_0EXPushTokenListener.h>

@interface ABI44_0_0EXPushTokenModule : ABI44_0_0EXExportedModule <ABI44_0_0EXEventEmitter, ABI44_0_0EXModuleRegistryConsumer, ABI44_0_0EXPushTokenListener>
@end
