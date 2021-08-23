// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXExportedModule.h>
#import <ExpoModulesCore/EXEventEmitter.h>
#import <ExpoModulesCore/EXModuleRegistryConsumer.h>
#import <EXNotifications/EXPushTokenListener.h>

@interface EXPushTokenModule : EXExportedModule <EXEventEmitter, EXModuleRegistryConsumer, EXPushTokenListener>
@end
