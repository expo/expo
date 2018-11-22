// Copyright 2018-present 650 Industries. All rights reserved.

#import <FirebaseMessaging/FirebaseMessaging.h>
#import <EXCore/EXModuleRegistry.h>
#import <EXCore/EXModuleRegistryConsumer.h>
#import <EXCore/EXEventEmitter.h>
#import <EXCore/EXEventEmitterService.h>

@interface EXFirebaseMessaging : EXExportedModule <EXModuleRegistryConsumer, FIRMessagingDelegate, EXEventEmitter>

+ (_Nonnull instancetype)instance;

#if !TARGET_OS_TV
- (void)didReceiveRemoteNotification:(nonnull NSDictionary *)userInfo;
#endif

@end
