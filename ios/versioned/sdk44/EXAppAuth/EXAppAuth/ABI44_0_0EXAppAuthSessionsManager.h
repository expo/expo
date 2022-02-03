// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXSingletonModule.h>
#import <AppAuth/AppAuth.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI44_0_0EXAppAuthSessionsManagerInterface <NSObject>

- (void)registerSession:(id<OIDExternalUserAgentSession>)session;
- (void)unregisterSession:(id<OIDExternalUserAgentSession>)session;

@end

@interface ABI44_0_0EXAppAuthSessionsManager : ABI44_0_0EXSingletonModule <ABI44_0_0EXAppAuthSessionsManagerInterface>

#if !TARGET_OS_TV
- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<NSString *, id> *)options;
#endif

@end

NS_ASSUME_NONNULL_END
