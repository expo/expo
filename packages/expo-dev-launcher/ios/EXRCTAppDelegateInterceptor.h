// Copyright 2015-present 650 Industries. All rights reserved.
#import <EXDevMenu/DevClientAppDelegate.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXRCTAppDelegateInterceptor : DevClientAppDelegate

@property(nonatomic, weak) id<RCTBridgeDelegate> bridgeDelegate;
@property(nonatomic, weak) id<RCTBridgeDelegate> interceptor;

- (instancetype)initWithBridgeDelegate:(id<RCTBridgeDelegate>)bridgeDelegate interceptor:(id<RCTBridgeDelegate>)interceptor;

@end

NS_ASSUME_NONNULL_END
