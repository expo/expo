

#import <FirebaseInvites/FirebaseInvites.h>
#import <EXCore/EXModuleRegistry.h>
#import <EXCore/EXModuleRegistryConsumer.h>
#import <EXCore/EXEventEmitter.h>

@interface EXFirebaseInvites : EXExportedModule <EXModuleRegistryConsumer, EXEventEmitter, FIRInviteDelegate>

+ (_Nonnull instancetype)instance;

@property _Nullable EXPromiseRejectBlock invitationsRejecter;
@property _Nullable EXPromiseResolveBlock invitationsResolver;

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options;
- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity restorationHandler:(void (^)(NSArray *))restorationHandler;

@end
