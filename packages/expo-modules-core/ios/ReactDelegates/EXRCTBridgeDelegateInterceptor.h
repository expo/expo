// Copyright 2018-present 650 Industries. All rights reserved.

#import <React/RCTBridgeDelegate.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXRCTBridgeDelegateInterceptor : NSObject<RCTBridgeDelegate>

@property (nonatomic, weak) id<RCTBridgeDelegate> bridgeDelegate;
@property (nonatomic, weak) id<RCTBridgeDelegate> interceptor;

- (instancetype)initWithBridgeDelegate:(id<RCTBridgeDelegate>)bridgeDelegate interceptor:(id<RCTBridgeDelegate>)interceptor;

@end

NS_ASSUME_NONNULL_END
