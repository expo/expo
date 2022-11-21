// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI47_0_0React/ABI47_0_0RCTBridgeDelegate.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI47_0_0EXRCTBridgeDelegateInterceptor : NSObject<ABI47_0_0RCTBridgeDelegate>

@property (nonatomic, weak) id<ABI47_0_0RCTBridgeDelegate> bridgeDelegate;
@property (nonatomic, weak) id<ABI47_0_0RCTBridgeDelegate> interceptor;

- (instancetype)initWithBridgeDelegate:(id<ABI47_0_0RCTBridgeDelegate>)bridgeDelegate interceptor:(id<ABI47_0_0RCTBridgeDelegate>)interceptor;

@end

NS_ASSUME_NONNULL_END
