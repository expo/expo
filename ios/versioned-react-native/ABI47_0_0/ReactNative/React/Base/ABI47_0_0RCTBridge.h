/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI47_0_0React/ABI47_0_0RCTBridgeDelegate.h>
#import <ABI47_0_0React/ABI47_0_0RCTBridgeModule.h>
#import <ABI47_0_0React/ABI47_0_0RCTDefines.h>
#import <ABI47_0_0React/ABI47_0_0RCTFrameUpdate.h>
#import <ABI47_0_0React/ABI47_0_0RCTInvalidating.h>

@class JSValue;
@class ABI47_0_0RCTBridge;
@class ABI47_0_0RCTPerformanceLogger;

/**
 * This notification fires when the bridge initializes.
 */
ABI47_0_0RCT_EXTERN NSString *const ABI47_0_0RCTJavaScriptWillStartLoadingNotification;

/**
 * This notification fires when the bridge starts executing the JS bundle.
 */
ABI47_0_0RCT_EXTERN NSString *const ABI47_0_0RCTJavaScriptWillStartExecutingNotification;

/**
 * This notification fires when the bridge has finished loading the JS bundle.
 */
ABI47_0_0RCT_EXTERN NSString *const ABI47_0_0RCTJavaScriptDidLoadNotification;

/**
 * This notification fires when the bridge failed to load the JS bundle. The
 * `error` key can be used to determine the error that occurred.
 */
ABI47_0_0RCT_EXTERN NSString *const ABI47_0_0RCTJavaScriptDidFailToLoadNotification;

/**
 * This notification fires each time a native module is instantiated. The
 * `module` key will contain a reference to the newly-created module instance.
 * Note that this notification may be fired before the module is available via
 * the `[bridge moduleForClass:]` method.
 */
ABI47_0_0RCT_EXTERN NSString *const ABI47_0_0RCTDidInitializeModuleNotification;

/**
 * This notification fires each time a module is setup after it is initialized. The
 * `ABI47_0_0RCTDidSetupModuleNotificationModuleNameKey` key will contain a reference to the module name and
 * `ABI47_0_0RCTDidSetupModuleNotificationSetupTimeKey` will contain the setup time in ms.
 */
ABI47_0_0RCT_EXTERN NSString *const ABI47_0_0RCTDidSetupModuleNotification;

/**
 * Key for the module name (NSString) in the
 * ABI47_0_0RCTDidSetupModuleNotification userInfo dictionary.
 */
ABI47_0_0RCT_EXTERN NSString *const ABI47_0_0RCTDidSetupModuleNotificationModuleNameKey;

/**
 * Key for the setup time (NSNumber) in the
 * ABI47_0_0RCTDidSetupModuleNotification userInfo dictionary.
 */
ABI47_0_0RCT_EXTERN NSString *const ABI47_0_0RCTDidSetupModuleNotificationSetupTimeKey;

/**
 * DEPRECATED - Use ABI47_0_0RCTReloadCommand instead. This notification fires just before the bridge starts
 * processing a request to reload.
 */
ABI47_0_0RCT_EXTERN NSString *const ABI47_0_0RCTBridgeWillReloadNotification;

/**
 * This notification fires whenever a fast refresh happens.
 */
ABI47_0_0RCT_EXTERN NSString *const ABI47_0_0RCTBridgeFastRefreshNotification;

/**
 * This notification fires just before the bridge begins downloading a script
 * from the packager.
 */
ABI47_0_0RCT_EXTERN NSString *const ABI47_0_0RCTBridgeWillDownloadScriptNotification;

/**
 * This notification fires just after the bridge finishes downloading a script
 * from the packager.
 */
ABI47_0_0RCT_EXTERN NSString *const ABI47_0_0RCTBridgeDidDownloadScriptNotification;

/**
 * This notification fires right after the bridge is about to invalidate NativeModule
 * instances during teardown. Handle this notification to perform additional invalidation.
 */
ABI47_0_0RCT_EXTERN NSString *const ABI47_0_0RCTBridgeWillInvalidateModulesNotification;

/**
 * This notification fires right after the bridge finishes invalidating NativeModule
 * instances during teardown. Handle this notification to perform additional invalidation.
 */
ABI47_0_0RCT_EXTERN NSString *const ABI47_0_0RCTBridgeDidInvalidateModulesNotification;

/**
 * This notification fires right before the bridge starting invalidation process.
 * Handle this notification to perform additional invalidation.
 * The notification can be issued on any thread.
 */
ABI47_0_0RCT_EXTERN NSString *const ABI47_0_0RCTBridgeWillBeInvalidatedNotification;

/**
 * Key for the ABI47_0_0RCTSource object in the ABI47_0_0RCTBridgeDidDownloadScriptNotification
 * userInfo dictionary.
 */
ABI47_0_0RCT_EXTERN NSString *const ABI47_0_0RCTBridgeDidDownloadScriptNotificationSourceKey;

/**
 * Key for the reload reason in the ABI47_0_0RCTBridgeWillReloadNotification userInfo dictionary.
 */
ABI47_0_0RCT_EXTERN NSString *const ABI47_0_0RCTBridgeDidDownloadScriptNotificationReasonKey;

/**
 * Key for the bridge description (NSString_ in the
 * ABI47_0_0RCTBridgeDidDownloadScriptNotification userInfo dictionary.
 */
ABI47_0_0RCT_EXTERN NSString *const ABI47_0_0RCTBridgeDidDownloadScriptNotificationBridgeDescriptionKey;

/**
 * This block can be used to instantiate modules that require additional
 * init parameters, or additional configuration prior to being used.
 * The bridge will call this block to instantiate the modules, and will
 * be responsible for invalidating/releasing them when the bridge is destroyed.
 * For this reason, the block should always return new module instances, and
 * module instances should not be shared between bridges.
 */
typedef NSArray<id<ABI47_0_0RCTBridgeModule>> * (^ABI47_0_0RCTBridgeModuleListProvider)(void);

/**
 * These blocks are used to report whether an additional bundle
 * fails or succeeds loading.
 */
typedef void (^ABI47_0_0RCTLoadAndExecuteErrorBlock)(NSError *error);

/**
 * This function returns the module name for a given class.
 */
ABI47_0_0RCT_EXTERN NSString *ABI47_0_0RCTBridgeModuleNameForClass(Class bridgeModuleClass);

/**
 * Experimental.
 * Check/set if JSI-bound NativeModule is enabled. By default it's off.
 */
ABI47_0_0RCT_EXTERN BOOL ABI47_0_0RCTTurboModuleEnabled(void);
ABI47_0_0RCT_EXTERN void ABI47_0_0RCTEnableTurboModule(BOOL enabled);

// Turn on TurboModule eager initialization
ABI47_0_0RCT_EXTERN BOOL ABI47_0_0RCTTurboModuleEagerInitEnabled(void);
ABI47_0_0RCT_EXTERN void ABI47_0_0RCTEnableTurboModuleEagerInit(BOOL enabled);

// Turn on TurboModule shared mutex initialization
ABI47_0_0RCT_EXTERN BOOL ABI47_0_0RCTTurboModuleSharedMutexInitEnabled(void);
ABI47_0_0RCT_EXTERN void ABI47_0_0RCTEnableTurboModuleSharedMutexInit(BOOL enabled);

// Turn off TurboModule delegate locking
ABI47_0_0RCT_EXTERN BOOL ABI47_0_0RCTTurboModuleManagerDelegateLockingDisabled(void);
ABI47_0_0RCT_EXTERN void ABI47_0_0RCTDisableTurboModuleManagerDelegateLocking(BOOL enabled);

// Turn off validAttribute: entries inside ViewConfigs for events
// TODO(109509380): Remove this gating
ABI47_0_0RCT_EXTERN BOOL ABI47_0_0RCTViewConfigEventValidAttributesDisabled(void);
ABI47_0_0RCT_EXTERN void ABI47_0_0RCTDisableViewConfigEventValidAttributes(BOOL disabled);

typedef enum {
  kABI47_0_0RCTGlobalScope,
  kABI47_0_0RCTGlobalScopeUsingRetainJSCallback,
  kABI47_0_0RCTTurboModuleManagerScope,
} ABI47_0_0RCTTurboModuleCleanupMode;

ABI47_0_0RCT_EXTERN ABI47_0_0RCTTurboModuleCleanupMode ABI47_0_0RCTGetTurboModuleCleanupMode(void);
ABI47_0_0RCT_EXTERN void ABI47_0_0RCTSetTurboModuleCleanupMode(ABI47_0_0RCTTurboModuleCleanupMode mode);

/**
 * Async batched bridge used to communicate with the JavaScript application.
 */
@interface ABI47_0_0RCTBridge : NSObject <ABI47_0_0RCTInvalidating>

/**
 * Creates a new bridge with a custom ABI47_0_0RCTBridgeDelegate.
 *
 * All the interaction with the JavaScript context should be done using the bridge
 * instance of the ABI47_0_0RCTBridgeModules. Modules will be automatically instantiated
 * using the default contructor, but you can optionally pass in an array of
 * pre-initialized module instances if they require additional init parameters
 * or configuration.
 */
- (instancetype)initWithDelegate:(id<ABI47_0_0RCTBridgeDelegate>)delegate launchOptions:(NSDictionary *)launchOptions;

/**
 * DEPRECATED: Use initWithDelegate:launchOptions: instead
 *
 * The designated initializer. This creates a new bridge on top of the specified
 * executor. The bridge should then be used for all subsequent communication
 * with the JavaScript code running in the executor. Modules will be automatically
 * instantiated using the default contructor, but you can optionally pass in an
 * array of pre-initialized module instances if they require additional init
 * parameters or configuration.
 */
- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                   moduleProvider:(ABI47_0_0RCTBridgeModuleListProvider)block
                    launchOptions:(NSDictionary *)launchOptions;

/**
 * This method is used to call functions in the JavaScript application context.
 * It is primarily intended for use by modules that require two-way communication
 * with the JavaScript code. Safe to call from any thread.
 */
- (void)enqueueJSCall:(NSString *)moduleDotMethod args:(NSArray *)args;
- (void)enqueueJSCall:(NSString *)module
               method:(NSString *)method
                 args:(NSArray *)args
           completion:(dispatch_block_t)completion;

/**
 * This method registers the file path of an additional JS segment by its ID.
 *
 * @experimental
 */
- (void)registerSegmentWithId:(NSUInteger)segmentId path:(NSString *)path;

/**
 * Retrieve a bridge module instance by name or class. Note that modules are
 * lazily instantiated, so calling these methods for the first time with a given
 * module name/class may cause the class to be synchronously instantiated,
 * potentially blocking both the calling thread and main thread for a short time.
 *
 * Note: This method does NOT lazily load the particular module if it's not yet loaded.
 */
- (id)moduleForName:(NSString *)moduleName;
- (id)moduleForName:(NSString *)moduleName lazilyLoadIfNecessary:(BOOL)lazilyLoad;
// Note: This method lazily load the module as necessary.
- (id)moduleForClass:(Class)moduleClass;

/**
 * When a NativeModule performs a lookup for a TurboModule, we need to query
 * the TurboModuleRegistry.
 */
- (void)setABI47_0_0RCTTurboModuleRegistry:(id<ABI47_0_0RCTTurboModuleRegistry>)turboModuleRegistry;

/**
 * This hook is called by the TurboModule infra with every TurboModule that's created.
 * It allows the bridge to attach properties to TurboModules that give TurboModules
 * access to Bridge APIs.
 */
- (void)attachBridgeAPIsToTurboModule:(id<ABI47_0_0RCTTurboModule>)module;

/**
 * Convenience method for retrieving all modules conforming to a given protocol.
 * Modules will be synchronously instantiated if they haven't already been,
 * potentially blocking both the calling thread and main thread for a short time.
 */
- (NSArray *)modulesConformingToProtocol:(Protocol *)protocol;

/**
 * Test if a module has been initialized. Use this prior to calling
 * `moduleForClass:` or `moduleForName:` if you do not want to cause the module
 * to be instantiated if it hasn't been already.
 */
- (BOOL)moduleIsInitialized:(Class)moduleClass;

/**
 * All registered bridge module classes.
 */
@property (nonatomic, copy, readonly) NSArray<Class> *moduleClasses;

/**
 * URL of the script that was loaded into the bridge.
 */
@property (nonatomic, strong, readonly) NSURL *bundleURL;

/**
 * The class of the executor currently being used. Changes to this value will
 * take effect after the bridge is reloaded.
 */
@property (nonatomic, strong) Class executorClass;

/**
 * The delegate provided during the bridge initialization
 */
@property (nonatomic, weak, readonly) id<ABI47_0_0RCTBridgeDelegate> delegate;

/**
 * The launch options that were used to initialize the bridge.
 */
@property (nonatomic, copy, readonly) NSDictionary *launchOptions;

/**
 * Use this to check if the bridge is currently loading.
 */
@property (nonatomic, readonly, getter=isLoading) BOOL loading;

/**
 * Use this to check if the bridge has been invalidated.
 */
@property (nonatomic, readonly, getter=isValid) BOOL valid;

/**
 * Link to the Performance Logger that logs ABI47_0_0React Native perf events.
 */
@property (nonatomic, readonly, strong) ABI47_0_0RCTPerformanceLogger *performanceLogger;

/**
 * Reload the bundle and reset executor & modules. Safe to call from any thread.
 */
- (void)reload __deprecated_msg("Use ABI47_0_0RCTReloadCommand instead");

/**
 * Reload the bundle and reset executor & modules. Safe to call from any thread.
 */
- (void)reloadWithReason:(NSString *)reason __deprecated_msg("Use ABI47_0_0RCTReloadCommand instead");

/**
 * Handle notifications for a fast refresh. Safe to call from any thread.
 */
- (void)onFastRefresh;

/**
 * Inform the bridge, and anything subscribing to it, that it should reload.
 */
- (void)requestReload __deprecated_msg("Use ABI47_0_0RCTReloadCommand instead");

/**
 * Says whether bridge has started receiving calls from JavaScript.
 */
- (BOOL)isBatchActive;

/**
 * Loads and executes additional bundles in the VM for development.
 */
- (void)loadAndExecuteSplitBundleURL:(NSURL *)bundleURL
                             onError:(ABI47_0_0RCTLoadAndExecuteErrorBlock)onError
                          onComplete:(dispatch_block_t)onComplete;

@end
