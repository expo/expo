// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI33_0_0UMCore/ABI33_0_0UMSingletonModule.h>
#import <AppAuth/AppAuth.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI33_0_0EXAppAuthSessionsManagerInterface <NSObject>

- (void)registerSession:(id<OIDExternalUserAgentSession>)session;
- (void)unregisterSession:(id<OIDExternalUserAgentSession>)session;

@end

@interface ABI33_0_0EXAppAuthSessionsManager : ABI33_0_0UMSingletonModule <ABI33_0_0EXAppAuthSessionsManagerInterface>

#if !TARGET_OS_TV
- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<NSString *, id> *)options;
#endif

@end

NS_ASSUME_NONNULL_END
