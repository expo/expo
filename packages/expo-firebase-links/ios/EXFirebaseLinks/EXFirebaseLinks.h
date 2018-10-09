

#import <FirebaseDynamicLinks/FirebaseDynamicLinks.h>
#import <EXCore/EXModuleRegistry.h>
#import <EXCore/EXModuleRegistryConsumer.h>
#import <EXCore/EXEventEmitter.h>

@interface EXFirebaseLinks : EXExportedModule <EXModuleRegistryConsumer, EXEventEmitter>

+ (_Nonnull instancetype)instance;

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options;
- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity restorationHandler:(void (^)(NSArray *))restorationHandler;
- (void)sendLink:(NSString *)link;

@end
