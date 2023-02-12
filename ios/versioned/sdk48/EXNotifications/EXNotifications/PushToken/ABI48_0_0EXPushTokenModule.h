// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXExportedModule.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXEventEmitter.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXModuleRegistryConsumer.h>
#import <ABI48_0_0EXNotifications/ABI48_0_0EXPushTokenListener.h>

@interface ABI48_0_0EXPushTokenModule : ABI48_0_0EXExportedModule <ABI48_0_0EXEventEmitter, ABI48_0_0EXModuleRegistryConsumer, ABI48_0_0EXPushTokenListener>
@end
