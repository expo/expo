// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXCore/EXModuleRegistry.h>
#import <EXCore/EXModuleRegistryConsumer.h>
#import <EXCore/EXEventEmitter.h>

@interface EXFirebaseNotifications : EXExportedModule <EXModuleRegistryConsumer, EXEventEmitter>
+ (void)configure;
+ (_Nonnull instancetype)instance;

#if !TARGET_OS_TV
- (void)didReceiveRemoteNotification:(nonnull NSDictionary *)userInfo fetchCompletionHandler:(void (^_Nonnull)(UIBackgroundFetchResult))completionHandler;
#endif

@end
