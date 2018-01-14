/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <JavaScriptCore/JavaScriptCore.h>
#import <JavaScriptCore/JSBase.h>

#import <ReactABI25_0_0/ABI25_0_0RCTBridge.h>

@class ABI25_0_0RCTModuleData;
@protocol ABI25_0_0RCTJavaScriptExecutor;

ABI25_0_0RCT_EXTERN NSArray<Class> *ABI25_0_0RCTGetModuleClasses(void);

ABI25_0_0RCT_EXTERN __attribute__((weak)) void ABI25_0_0RCTFBQuickPerformanceLoggerConfigureHooks(JSGlobalContextRef ctx);

#if ABI25_0_0RCT_DEBUG
ABI25_0_0RCT_EXTERN void ABI25_0_0RCTVerifyAllModulesExported(NSArray *extraModules);
#endif

@interface ABI25_0_0RCTBridge ()

// Private designated initializer
- (instancetype)initWithDelegate:(id<ABI25_0_0RCTBridgeDelegate>)delegate
                       bundleURL:(NSURL *)bundleURL
                  moduleProvider:(ABI25_0_0RCTBridgeModuleListProvider)block
                   launchOptions:(NSDictionary *)launchOptions NS_DESIGNATED_INITIALIZER;

// Used for the profiler flow events between JS and native
@property (nonatomic, assign) int64_t flowID;
@property (nonatomic, assign) CFMutableDictionaryRef flowIDMap;
@property (nonatomic, strong) NSLock *flowIDMapLock;

// Used by ABI25_0_0RCTDevMenu
@property (nonatomic, copy) NSString *bridgeDescription;

+ (instancetype)currentBridge;
+ (void)setCurrentBridge:(ABI25_0_0RCTBridge *)bridge;

/**
 * Bridge setup code - creates an instance of ABI25_0_0RCTBachedBridge. Exposed for
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
 * a background thread if the ABI25_0_0RCTBridge happens to deallocate on a background
 * thread. Therefore, we want all writes to it to be seen atomically.
 */
@property (atomic, strong) ABI25_0_0RCTBridge *batchedBridge;

/**
 * The block that creates the modules' instances to be added to the bridge.
 * Exposed for the ABI25_0_0RCTBatchedBridge
 */
@property (nonatomic, copy, readonly) ABI25_0_0RCTBridgeModuleListProvider moduleProvider;

/**
 * Used by ABI25_0_0RCTDevMenu to override the `hot` param of the current bundleURL.
 */
@property (nonatomic, strong, readwrite) NSURL *bundleURL;

@end

@interface ABI25_0_0RCTBridge (ABI25_0_0RCTBatchedBridge)

/**
 * Access the underlying JavaScript executor. You can use this in unit tests to detect
 * when the executor has been invalidated, or when you want to schedule calls on the
 * JS VM outside of ReactABI25_0_0 Native. Use with care!
 */
@property (nonatomic, weak, readonly) id<ABI25_0_0RCTJavaScriptExecutor> javaScriptExecutor;

/**
 * Used by ABI25_0_0RCTModuleData
 */

@property (nonatomic, weak, readonly) ABI25_0_0RCTBridge *parentBridge;

/**
 * Used by ABI25_0_0RCTModuleData
 */
@property (nonatomic, assign, readonly) BOOL moduleSetupComplete;

/**
 * Called on the child bridge to run the executor and start loading.
 */
- (void)start;

/**
 * Used by ABI25_0_0RCTModuleData to register the module for frame updates after it is
 * lazily initialized.
 */
- (void)registerModuleForFrameUpdates:(id<ABI25_0_0RCTBridgeModule>)module
                       withModuleData:(ABI25_0_0RCTModuleData *)moduleData;

/**
 * Dispatch work to a module's queue - this is also suports the fake ABI25_0_0RCTJSThread
 * queue. Exposed for the ABI25_0_0RCTProfiler
 */
- (void)dispatchBlock:(dispatch_block_t)block queue:(dispatch_queue_t)queue;

/**
 * Get the module data for a given module name. Used by UIManager to implement
 * the `dispatchViewManagerCommand` method.
 */
- (ABI25_0_0RCTModuleData *)moduleDataForName:(NSString *)moduleName;

/**
* Registers additional classes with the ModuleRegistry.
*/
- (void)registerAdditionalModuleClasses:(NSArray<Class> *)newModules;

/**
 * Systrace profiler toggling methods exposed for the ABI25_0_0RCTDevMenu
 */
- (void)startProfiling;
- (void)stopProfiling:(void (^)(NSData *))callback;

/**
 * Exposed for the ABI25_0_0RCTJSCExecutor for sending native methods called from
 * JavaScript in the middle of a batch.
 */
- (void)handleBuffer:(NSArray<NSArray *> *)buffer batchEnded:(BOOL)hasEnded;

/**
 * Synchronously call a specific native module's method and return the result
 */
- (id)callNativeModule:(NSUInteger)moduleID
                method:(NSUInteger)methodID
                params:(NSArray *)params;

/**
 * Exposed for the ABI25_0_0RCTJSCExecutor for lazily loading native modules
 */
- (NSArray *)configForModuleName:(NSString *)moduleName;

/**
 * Hook exposed for ABI25_0_0RCTLog to send logs to JavaScript when not running in JSC
 */
- (void)logMessage:(NSString *)message level:(NSString *)level;

/**
 * Allow super fast, one time, timers to skip the queue and be directly executed
 */
- (void)_immediatelyCallTimer:(NSNumber *)timer;

@end

@interface ABI25_0_0RCTBridge (JavaScriptCore)

/**
 * The raw JSGlobalContextRef used by the bridge.
 */
@property (nonatomic, readonly, assign) JSGlobalContextRef jsContextRef;

@end

@interface ABI25_0_0RCTBatchedBridge : ABI25_0_0RCTBridge <ABI25_0_0RCTInvalidating>

@property (nonatomic, weak, readonly) ABI25_0_0RCTBridge *parentBridge;
@property (nonatomic, weak, readonly) id<ABI25_0_0RCTJavaScriptExecutor> javaScriptExecutor;
@property (nonatomic, assign, readonly) BOOL moduleSetupComplete;

- (instancetype)initWithParentBridge:(ABI25_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;
- (void)start;

@end
