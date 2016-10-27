// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXReactAppManager.h"

NS_ASSUME_NONNULL_BEGIN

@class EXFrame;

@interface EXFrameReactAppManager : EXReactAppManager

- (instancetype)initWithEXFrame:(EXFrame *)frame;
- (void)logKernelAnalyticsEventWithParams:(NSDictionary *)params;
- (void)registerErrorForBridge:(NSError *)error;

/**
 *  Versioned EXAppLoadingManager instance for this app manager's bridge, if any.
 */
- (id)appLoadingManagerInstance;

@property (nonatomic, weak, readonly) EXFrame *frame;

@end

NS_ASSUME_NONNULL_END
