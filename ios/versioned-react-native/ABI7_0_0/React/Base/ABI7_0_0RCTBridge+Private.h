/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI7_0_0RCTBridge.h"

@class ABI7_0_0RCTModuleData;

@interface ABI7_0_0RCTBridge ()

// Used for the profiler flow events between JS and native
@property (nonatomic, assign) int64_t flowID;
@property (nonatomic, assign) CFMutableDictionaryRef flowIDMap;
@property (nonatomic, strong) NSLock *flowIDMapLock;

+ (instancetype)currentBridge;
+ (void)setCurrentBridge:(ABI7_0_0RCTBridge *)bridge;

/**
 * Bridge setup code - creates an instance of ABI7_0_0RCTBachedBridge. Exposed for
 * test only
 */
- (void)setUp;

/**
 * This method is used to invoke a callback that was registered in the
 * JavaScript application context. Safe to call from any thread.
 */
- (void)enqueueCallback:(NSNumber *)cbID args:(NSArray *)args;

/**
 * This property is mostly used on the main thread, but may be touched from
 * a background thread if the ABI7_0_0RCTBridge happens to deallocate on a background
 * thread. Therefore, we want all writes to it to be seen atomically.
 */
@property (atomic, strong) ABI7_0_0RCTBridge *batchedBridge;

/**
 * The block that creates the modules' instances to be added to the bridge.
 * Exposed for the ABI7_0_0RCTBatchedBridge
 */
@property (nonatomic, copy, readonly) ABI7_0_0RCTBridgeModuleProviderBlock moduleProvider;

/**
 * Used by ABI7_0_0RCTDevMenu to override the `hot` param of the current bundleURL.
 */
@property (nonatomic, strong, readwrite) NSURL *bundleURL;

@end

@interface ABI7_0_0RCTBridge (ABI7_0_0RCTBatchedBridge)

/**
 * Used for unit testing, to detect when executor has been invalidated.
 */
@property (nonatomic, weak, readonly) id<ABI7_0_0RCTJavaScriptExecutor> javaScriptExecutor;

/**
 * Used by ABI7_0_0RCTModuleData
 */
@property (nonatomic, assign, readonly) BOOL moduleSetupComplete;

/**
 * Used by ABI7_0_0RCTModuleData to register the module for frame updates after it is
 * lazily initialized.
 */
- (void)registerModuleForFrameUpdates:(id<ABI7_0_0RCTBridgeModule>)module
                       withModuleData:(ABI7_0_0RCTModuleData *)moduleData;

/**
 * Dispatch work to a module's queue - this is also suports the fake ABI7_0_0RCTJSThread
 * queue. Exposed for the ABI7_0_0RCTProfiler
 */
- (void)dispatchBlock:(dispatch_block_t)block queue:(dispatch_queue_t)queue;

/**
 * Get the module data for a given module name. Used by UIManager to implement
 * the `dispatchViewManagerCommand` method.
 */
- (ABI7_0_0RCTModuleData *)moduleDataForName:(NSString *)moduleName;

/**
 * Systrace profiler toggling methods exposed for the ABI7_0_0RCTDevMenu
 */
- (void)startProfiling;
- (void)stopProfiling:(void (^)(NSData *))callback;

/**
 * Executes native calls sent by JavaScript. Exposed for testing purposes only
 */
- (void)handleBuffer:(NSArray<NSArray *> *)buffer;

/**
 * Exposed for the ABI7_0_0RCTJSCExecutor for sending native methods called from
 * JavaScript in the middle of a batch.
 */
- (void)handleBuffer:(NSArray<NSArray *> *)buffer batchEnded:(BOOL)hasEnded;

/**
 * Exposed for the ABI7_0_0RCTJSCExecutor for lazily loading native modules
 */
- (NSArray *)configForModuleName:(NSString *)moduleName;

/**
 * Hook exposed for ABI7_0_0RCTLog to send logs to JavaScript when not running in JSC
 */
- (void)logMessage:(NSString *)message level:(NSString *)level;

/**
 * Allow super fast, one time, timers to skip the queue and be directly executed
 */
- (void)_immediatelyCallTimer:(NSNumber *)timer;

@end

@interface ABI7_0_0RCTBatchedBridge : ABI7_0_0RCTBridge <ABI7_0_0RCTInvalidating>

@property (nonatomic, weak) ABI7_0_0RCTBridge *parentBridge;
@property (nonatomic, weak) id<ABI7_0_0RCTJavaScriptExecutor> javaScriptExecutor;
@property (nonatomic, assign) BOOL moduleSetupComplete;

- (instancetype)initWithParentBridge:(ABI7_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

@end
