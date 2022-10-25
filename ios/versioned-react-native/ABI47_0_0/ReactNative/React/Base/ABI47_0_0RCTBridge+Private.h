/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI47_0_0React/ABI47_0_0RCTBridge.h>

@class ABI47_0_0RCTModuleRegistry;
@class ABI47_0_0RCTModuleData;
@protocol ABI47_0_0RCTJavaScriptExecutor;

ABI47_0_0RCT_EXTERN NSArray<Class> *ABI47_0_0RCTGetModuleClasses(void);
ABI47_0_0RCT_EXTERN void ABI47_0_0RCTRegisterModule(Class);

@interface ABI47_0_0RCTBridge ()

// Private designated initializer
- (instancetype)initWithDelegate:(id<ABI47_0_0RCTBridgeDelegate>)delegate
                       bundleURL:(NSURL *)bundleURL
                  moduleProvider:(ABI47_0_0RCTBridgeModuleListProvider)block
                   launchOptions:(NSDictionary *)launchOptions NS_DESIGNATED_INITIALIZER;

// Used for the profiler flow events between JS and native
@property (nonatomic, assign) int64_t flowID;
@property (nonatomic, assign) CFMutableDictionaryRef flowIDMap;
@property (nonatomic, strong) NSLock *flowIDMapLock;

// Used by ABI47_0_0RCTDevMenu
@property (nonatomic, copy) NSString *bridgeDescription;

+ (instancetype)currentBridge;
+ (void)setCurrentBridge:(ABI47_0_0RCTBridge *)bridge;

/**
 * Bridge setup code - creates an instance of ABI47_0_0RCTBachedBridge. Exposed for
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
 * a background thread if the ABI47_0_0RCTBridge happens to deallocate on a background
 * thread. Therefore, we want all writes to it to be seen atomically.
 */
@property (atomic, strong) ABI47_0_0RCTBridge *batchedBridge;

/**
 * The block that creates the modules' instances to be added to the bridge.
 * Exposed for ABI47_0_0RCTCxxBridge
 */
@property (nonatomic, copy, readonly) ABI47_0_0RCTBridgeModuleListProvider moduleProvider;

/**
 * Used by ABI47_0_0RCTDevMenu to override the `hot` param of the current bundleURL.
 */
@property (nonatomic, strong, readwrite) NSURL *bundleURL;

/**
 * An object that allows one to require NativeModules/TurboModules.
 * ABI47_0_0RCTModuleRegistry is implemented in bridgeless mode and bridge mode.
 * Used by ABI47_0_0RCTRootView.
 */
@property (nonatomic, strong, readonly) ABI47_0_0RCTModuleRegistry *moduleRegistry;

@end

@interface ABI47_0_0RCTBridge (ABI47_0_0RCTCxxBridge)

/**
 * Used by ABI47_0_0RCTModuleData
 */

@property (nonatomic, weak, readonly) ABI47_0_0RCTBridge *parentBridge;

/**
 * Used by ABI47_0_0RCTModuleData
 */
@property (nonatomic, assign, readonly) BOOL moduleSetupComplete;

/**
 * Called on the child bridge to run the executor and start loading.
 */
- (void)start;

/**
 * Used by ABI47_0_0RCTModuleData to register the module for frame updates after it is
 * lazily initialized.
 */
- (void)registerModuleForFrameUpdates:(id<ABI47_0_0RCTBridgeModule>)module withModuleData:(ABI47_0_0RCTModuleData *)moduleData;

/**
 * Dispatch work to a module's queue - this is also suports the fake ABI47_0_0RCTJSThread
 * queue. Exposed for the ABI47_0_0RCTProfiler
 */
- (void)dispatchBlock:(dispatch_block_t)block queue:(dispatch_queue_t)queue;

/**
 * Get the module data for a given module name. Used by UIManager to implement
 * the `dispatchViewManagerCommand` method.
 */
- (ABI47_0_0RCTModuleData *)moduleDataForName:(NSString *)moduleName;

/**
 * Registers additional classes with the ModuleRegistry.
 */
- (void)registerAdditionalModuleClasses:(NSArray<Class> *)newModules;

/**
 * Updates the ModuleRegistry with a pre-initialized instance.
 */
- (void)updateModuleWithInstance:(id<ABI47_0_0RCTBridgeModule>)instance;

/**
 * Systrace profiler toggling methods exposed for the ABI47_0_0RCTDevMenu
 */
- (void)startProfiling;
- (void)stopProfiling:(void (^)(NSData *))callback;

/**
 * Synchronously call a specific native module's method and return the result
 */
- (id)callNativeModule:(NSUInteger)moduleID method:(NSUInteger)methodID params:(NSArray *)params;

/**
 * Hook exposed for ABI47_0_0RCTLog to send logs to JavaScript when not running in JSC
 */
- (void)logMessage:(NSString *)message level:(NSString *)level;

/**
 * Allow super fast, one time, timers to skip the queue and be directly executed
 */
- (void)_immediatelyCallTimer:(NSNumber *)timer;

@end

@interface ABI47_0_0RCTBridge (Inspector)

@property (nonatomic, readonly, getter=isInspectable) BOOL inspectable;

@end

@interface ABI47_0_0RCTCxxBridge : ABI47_0_0RCTBridge

// TODO(cjhopman): this seems unsafe unless we require that it is only called on the main js queue.
@property (nonatomic, readonly) void *runtime;

- (instancetype)initWithParentBridge:(ABI47_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

@end
