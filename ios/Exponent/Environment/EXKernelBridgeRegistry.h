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

/**
 *  Sometimes we need to keep a native reference to an EXFrame error that
 *  we want to sandbox to only that frame.
 *  For example, RCTJavaScriptDidFailToLoadNotification will also call RCTFatal(),
 *  but we don't want such an error to take down the entire kernel.
 */
- (void)setError: (NSError *)error forBridge: (id)bridge;
- (BOOL)errorBelongsToBridge: (NSError *)error;

- (EXKernelBridgeRecord *)recordForBridge: (id)bridge;
- (EXKernelReactAppManager *)kernelAppManager;
- (NSEnumerator<id> *)bridgeEnumerator; // does not include kernel

/**
 *  True if any bridge for this experience id had an error, and has not successfully loaded
 *  since the error was reported.
 */
- (BOOL)experienceIdIsRecoveringFromError:(NSString *)experienceId;

@end
