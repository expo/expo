

#import <FirebaseMessaging/FirebaseMessaging.h>
#import <EXCore/EXModuleRegistry.h>
#import <EXCore/EXModuleRegistryConsumer.h>
#import <EXCore/EXEventEmitter.h>
#import <EXCore/EXEventEmitterService.h>

@interface EXFirebaseMessaging : EXExportedModule <EXModuleRegistryConsumer, EXEventEmitter, FIRMessagingDelegate>

+ (_Nonnull instancetype)instance;

#if !TARGET_OS_TV
- (void)didReceiveRemoteNotification:(nonnull NSDictionary *)userInfo;
- (void)didRegisterUserNotificationSettings:(nonnull UIUserNotificationSettings *)notificationSettings;
#endif

@end
