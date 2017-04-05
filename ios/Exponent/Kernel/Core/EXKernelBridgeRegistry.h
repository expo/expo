// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernelBridgeRecord.h"

@class RCTBridge;
@class EXReactAppManager;
@class EXFrameReactAppManager;
@class EXKernelReactAppManager;

@interface EXKernelBridgeRegistry : NSObject

- (void)registerKernelAppManager: (EXKernelReactAppManager *)appManager;
- (void)unregisterKernelAppManager;

- (void)registerBridge: (id)bridge withExperienceId: (NSString *)experienceId appManager: (EXFrameReactAppManager *)appManager;
- (void)unregisterBridge: (id)bridge;

/**
 *  We pass some system events on to the visible experience,
 *  but not to any others which may be open, e.g. UIApplicationState changes.
 */
@property (nonatomic, weak) id lastKnownForegroundBridge;

/**
 *  Helper method, computed from `self.lastKnownForegroundBridge`.
 */
@property (nonatomic, readonly) EXReactAppManager *lastKnownForegroundAppManager;

- (EXKernelBridgeRecord *)recordForBridge: (id)bridge;
- (EXKernelReactAppManager *)kernelAppManager;
- (NSEnumerator<id> *)bridgeEnumerator; // does not include kernel

@end
