/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI49_0_0React/ABI49_0_0RCTBridge.h>
#import <ABI49_0_0React/ABI49_0_0RCTBridgeDelegate.h>
#import <UIKit/UIKit.h>

@class ABI49_0_0RCTSurfacePresenterBridgeAdapter;
@class ABI49_0_0RCTTurboModuleManager;

/**
 * The ABI49_0_0RCTAppDelegate is an utility class that implements some base configurations for all the ABI49_0_0React Native apps.
 * It is not mandatory to use it, but it could simplify your AppDelegate code.
 *
 * To use it, you just need to make your AppDelegate a subclass of ABI49_0_0RCTAppDelegate:
 *
 * ```objc
 * #import <ABI49_0_0React/ABI49_0_0RCTAppDelegate.h>
 * @interface AppDelegate: ABI49_0_0RCTAppDelegate
 * @end
 * ```
 *
 * All the methods implemented by the ABI49_0_0RCTAppDelegate can be overridden by your AppDelegate if you need to provide a
 custom implementation.
 * If you need to customize the default implementation, you can invoke `[super <method_name>]` and use the returned
 object.
 *
 * Overridable methods
 * Shared:
 *   - (ABI49_0_0RCTBridge *)createBridgeWithDelegate:(id<ABI49_0_0RCTBridgeDelegate>)delegate launchOptions:(NSDictionary
 *)launchOptions;
 *   - (UIView *)createRootViewWithBridge:(ABI49_0_0RCTBridge *)bridge moduleName:(NSString*)moduleName initProps:(NSDictionary
 *)initProps;
 *   - (UIViewController *)createRootViewController;
 * New Architecture:
 *   - (BOOL)concurrentRootEnabled
 *   - (BOOL)turboModuleEnabled;
 *   - (BOOL)fabricEnabled;
 *   - (NSDictionary *)prepareInitialProps
 *   - (Class)getModuleClassFromName:(const char *)name
 *   - (std::shared_ptr<ABI49_0_0facebook::ABI49_0_0React::TurboModule>)getTurboModule:(const std::string &)name
                                                      jsInvoker:(std::shared_ptr<ABI49_0_0facebook::ABI49_0_0React::CallInvoker>)jsInvoker
 *   - (std::shared_ptr<ABI49_0_0facebook::ABI49_0_0React::TurboModule>)getTurboModule:(const std::string &)name
                                                     initParams:
                                                         (const ABI49_0_0facebook::ABI49_0_0React::ObjCTurboModule::InitParams &)params
 *   - (id<ABI49_0_0RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass
 */
@interface ABI49_0_0RCTAppDelegate : UIResponder <UIApplicationDelegate, ABI49_0_0RCTBridgeDelegate>

/// The window object, used to render the UViewControllers
@property (nonatomic, strong) UIWindow *window;
@property (nonatomic, strong) ABI49_0_0RCTBridge *bridge;
@property (nonatomic, strong) NSString *moduleName;
@property (nonatomic, strong) NSDictionary *initialProps;

/**
 * It creates a `ABI49_0_0RCTBridge` using a delegate and some launch options.
 * By default, it is invoked passing `self` as a delegate.
 * You can override this function to customize the logic that creates the ABI49_0_0RCTBridge
 *
 * @parameter: delegate - an object that implements the `ABI49_0_0RCTBridgeDelegate` protocol.
 * @parameter: launchOptions - a dictionary with a set of options.
 *
 * @returns: a newly created instance of ABI49_0_0RCTBridge.
 */
- (ABI49_0_0RCTBridge *)createBridgeWithDelegate:(id<ABI49_0_0RCTBridgeDelegate>)delegate launchOptions:(NSDictionary *)launchOptions;

/**
 * It creates a `UIView` starting from a bridge, a module name and a set of initial properties.
 * By default, it is invoked using the bridge created by `createBridgeWithDelegate:launchOptions` and
 * the name in the `self.moduleName` variable.
 * You can override this function to customize the logic that creates the Root View.
 *
 * @parameter: bridge - an instance of the `ABI49_0_0RCTBridge` object.
 * @parameter: moduleName - the name of the app, used by Metro to resolve the module.
 * @parameter: initProps - a set of initial properties.
 *
 * @returns: a UIView properly configured with a bridge for ABI49_0_0React Native.
 */
- (UIView *)createRootViewWithBridge:(ABI49_0_0RCTBridge *)bridge
                          moduleName:(NSString *)moduleName
                           initProps:(NSDictionary *)initProps;

/**
 * It creates the RootViewController.
 * By default, it creates a new instance of a `UIViewController`.
 * You can override it to provide your own initial ViewController.
 *
 * @return: an instance of `UIViewController`.
 */
- (UIViewController *)createRootViewController;

/// This method controls whether the App will use RuntimeScheduler. Only applicable in the legacy architecture.
///
/// @return: `YES` to use RuntimeScheduler, `NO` to use JavaScript scheduler. The default value is `YES`.
- (BOOL)runtimeSchedulerEnabled;

#if ABI49_0_0RCT_NEW_ARCH_ENABLED

/// The TurboModule manager
@property (nonatomic, strong) ABI49_0_0RCTTurboModuleManager *turboModuleManager;
@property (nonatomic, strong) ABI49_0_0RCTSurfacePresenterBridgeAdapter *bridgeAdapter;

/// This method controls whether the `turboModules` feature of the New Architecture is turned on or off.
///
/// @note: This is required to be rendering on Fabric (i.e. on the New Architecture).
/// @return: `true` if the Turbo Native Module are enabled. Otherwise, it returns `false`.
- (BOOL)turboModuleEnabled;

/// This method controls whether the App will use the Fabric renderer of the New Architecture or not.
///
/// @return: `true` if the Fabric Renderer is enabled. Otherwise, it returns `false`.
- (BOOL)fabricEnabled;

#endif

@end
