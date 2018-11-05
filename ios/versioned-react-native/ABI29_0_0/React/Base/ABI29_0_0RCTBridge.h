/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI29_0_0/ABI29_0_0RCTBridgeDelegate.h>
#import <ReactABI29_0_0/ABI29_0_0RCTBridgeModule.h>
#import <ReactABI29_0_0/ABI29_0_0RCTDefines.h>
#import <ReactABI29_0_0/ABI29_0_0RCTFrameUpdate.h>
#import <ReactABI29_0_0/ABI29_0_0RCTInvalidating.h>

@class JSValue;
@class ABI29_0_0RCTBridge;
@class ABI29_0_0RCTEventDispatcher;
@class ABI29_0_0RCTPerformanceLogger;

/**
 * This notification fires when the bridge initializes.
 */
ABI29_0_0RCT_EXTERN NSString *const ABI29_0_0RCTJavaScriptWillStartLoadingNotification;


/**
 * This notification fires when the bridge starts executing the JS bundle.
 */
ABI29_0_0RCT_EXTERN NSString *const ABI29_0_0RCTJavaScriptWillStartExecutingNotification;

/**
 * This notification fires when the bridge has finished loading the JS bundle.
 */
ABI29_0_0RCT_EXTERN NSString *const ABI29_0_0RCTJavaScriptDidLoadNotification;

/**
 * This notification fires when the bridge failed to load the JS bundle. The
 * `error` key can be used to determine the error that occurred.
 */
ABI29_0_0RCT_EXTERN NSString *const ABI29_0_0RCTJavaScriptDidFailToLoadNotification;

/**
 * This notification fires each time a native module is instantiated. The
 * `module` key will contain a reference to the newly-created module instance.
 * Note that this notification may be fired before the module is available via
 * the `[bridge moduleForClass:]` method.
 */
ABI29_0_0RCT_EXTERN NSString *const ABI29_0_0RCTDidInitializeModuleNotification;

/**
 * This notification fires just before the bridge starts processing a request to
 * reload.
 */
ABI29_0_0RCT_EXTERN NSString *const ABI29_0_0RCTBridgeWillReloadNotification;

/**
 * This notification fires just before the bridge begins downloading a script
 * from the packager.
 */
ABI29_0_0RCT_EXTERN NSString *const ABI29_0_0RCTBridgeWillDownloadScriptNotification;

/**
 * This notification fires just after the bridge finishes downloading a script
 * from the packager.
 */
ABI29_0_0RCT_EXTERN NSString *const ABI29_0_0RCTBridgeDidDownloadScriptNotification;

/**
 * Key for the ABI29_0_0RCTSource object in the ABI29_0_0RCTBridgeDidDownloadScriptNotification
 * userInfo dictionary.
 */
ABI29_0_0RCT_EXTERN NSString *const ABI29_0_0RCTBridgeDidDownloadScriptNotificationSourceKey;

/**
 * This block can be used to instantiate modules that require additional
 * init parameters, or additional configuration prior to being used.
 * The bridge will call this block to instatiate the modules, and will
 * be responsible for invalidating/releasing them when the bridge is destroyed.
 * For this reason, the block should always return new module instances, and
 * module instances should not be shared between bridges.
 */
typedef NSArray<id<ABI29_0_0RCTBridgeModule>> *(^ABI29_0_0RCTBridgeModuleListProvider)(void);

/**
 * This function returns the module name for a given class.
 */
ABI29_0_0RCT_EXTERN NSString *ABI29_0_0RCTBridgeModuleNameForClass(Class bridgeModuleClass);

/**
 * Async batched bridge used to communicate with the JavaScript application.
 */
@interface ABI29_0_0RCTBridge : NSObject <ABI29_0_0RCTInvalidating>

/**
 * Creates a new bridge with a custom ABI29_0_0RCTBridgeDelegate.
 *
 * All the interaction with the JavaScript context should be done using the bridge
 * instance of the ABI29_0_0RCTBridgeModules. Modules will be automatically instantiated
 * using the default contructor, but you can optionally pass in an array of
 * pre-initialized module instances if they require additional init parameters
 * or configuration.
 */
- (instancetype)initWithDelegate:(id<ABI29_0_0RCTBridgeDelegate>)delegate
                   launchOptions:(NSDictionary *)launchOptions;

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
                   moduleProvider:(ABI29_0_0RCTBridgeModuleListProvider)block
                    launchOptions:(NSDictionary *)launchOptions;

/**
 * This method is used to call functions in the JavaScript application context.
 * It is primarily intended for use by modules that require two-way communication
 * with the JavaScript code. Safe to call from any thread.
 */
- (void)enqueueJSCall:(NSString *)moduleDotMethod args:(NSArray *)args;
- (void)enqueueJSCall:(NSString *)module method:(NSString *)method args:(NSArray *)args completion:(dispatch_block_t)completion;

/**
 * This method registers the file path of an additional JS segment by its ID.
 *
 * @experimental
 */
- (void)registerSegmentWithId:(NSUInteger)segmentId path:(NSString *)path;

/**
 * Retrieve a bridge module instance by name or class. Note that modules are
 * lazily instantiated, so calling these methods for the first time with a given
 * module name/class may cause the class to be sychronously instantiated,
 * potentially blocking both the calling thread and main thread for a short time.
 */
- (id)moduleForName:(NSString *)moduleName;
- (id)moduleForClass:(Class)moduleClass;

/**
 * Convenience method for retrieving all modules conforming to a given protocol.
 * Modules will be sychronously instantiated if they haven't already been,
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
 * Retrieve an extra module that gets bound to the JS context, if any.
 */
- (id)jsBoundExtraModuleForClass:(Class)moduleClass;

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
@property (nonatomic, weak, readonly) id<ABI29_0_0RCTBridgeDelegate> delegate;

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
 * Link to the Performance Logger that logs ReactABI29_0_0 Native perf events.
 */
@property (nonatomic, readonly, strong) ABI29_0_0RCTPerformanceLogger *performanceLogger;

/**
 * Reload the bundle and reset executor & modules. Safe to call from any thread.
 */
- (void)reload;

/**
 * Inform the bridge, and anything subscribing to it, that it should reload.
 */
- (void)requestReload __deprecated_msg("Call reload instead");

/**
 * Says whether bridge has started receiving calls from javascript.
 */
- (BOOL)isBatchActive;

@end
