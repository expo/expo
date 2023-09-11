/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import <ABI48_0_0React/ABI48_0_0RCTDefines.h>
#import <ABI48_0_0React/ABI48_0_0RCTJSThread.h>

#import "ABI48_0_0RCTBundleManager.h"

@class ABI48_0_0RCTBridge;
@protocol ABI48_0_0RCTBridgeMethod;
@protocol ABI48_0_0RCTTurboModule;
@protocol ABI48_0_0RCTTurboModuleRegistry;
@class ABI48_0_0RCTModuleRegistry;
@class ABI48_0_0RCTViewRegistry;
@class ABI48_0_0RCTCallableJSModules;

/**
 * The type of a block that is capable of sending a response to a bridged
 * operation. Use this for returning callback methods to JS.
 */
typedef void (^ABI48_0_0RCTResponseSenderBlock)(NSArray *response);

/**
 * The type of a block that is capable of sending an error response to a
 * bridged operation. Use this for returning error information to JS.
 */
typedef void (^ABI48_0_0RCTResponseErrorBlock)(NSError *error);

/**
 * Block that bridge modules use to resolve the JS promise waiting for a result.
 * Nil results are supported and are converted to JS's undefined value.
 */
typedef void (^ABI48_0_0RCTPromiseResolveBlock)(id result);

/**
 * Block that bridge modules use to reject the JS promise waiting for a result.
 * The error may be nil but it is preferable to pass an NSError object for more
 * precise error messages.
 */
typedef void (^ABI48_0_0RCTPromiseRejectBlock)(NSString *code, NSString *message, NSError *error);

ABI48_0_0RCT_EXTERN_C_BEGIN

typedef struct ABI48_0_0RCTMethodInfo {
  const char *const jsName;
  const char *const objcName;
  const BOOL isSync;
} ABI48_0_0RCTMethodInfo;

ABI48_0_0RCT_EXTERN_C_END

/**
 * Provides the interface needed to register a bridge module.
 */
@protocol ABI48_0_0RCTBridgeModule <NSObject>

/**
 * Place this macro in your class implementation to automatically register
 * your module with the bridge when it loads. The optional js_name argument
 * will be used as the JS module name. If omitted, the JS module name will
 * match the Objective-C class name.
 */
#define ABI48_0_0RCT_EXPORT_MODULE(js_name)          \
  ABI48_0_0RCT_EXTERN void ABI48_0_0RCTRegisterModule(Class); \
  +(NSString *)moduleName                   \
  {                                         \
    return @ #js_name;                      \
  }                                         \
  +(void)load                               \
  {                                         \
    ABI48_0_0RCTRegisterModule(self);                \
  }

/**
 * Same as ABI48_0_0RCT_EXPORT_MODULE, but uses __attribute__((constructor)) for module
 * registration. Useful for registering swift classes that forbids use of load
 * Used in ABI48_0_0RCT_EXTERN_REMAP_MODULE
 */
#define ABI48_0_0RCT_EXPORT_MODULE_NO_LOAD(js_name, objc_name)                           \
  ABI48_0_0RCT_EXTERN void ABI48_0_0RCTRegisterModule(Class);                                     \
  +(NSString *)moduleName                                                       \
  {                                                                             \
    return @ #js_name;                                                          \
  }                                                                             \
  __attribute__((constructor)) static void ABI48_0_0RCT_CONCAT(initialize_, objc_name)() \
  {                                                                             \
    ABI48_0_0RCTRegisterModule([objc_name class]);                                       \
  }

/**
 * To improve startup performance users may want to generate their module lists
 * at build time and hook the delegate to merge with the runtime list. This
 * macro takes the place of the above for those cases by omitting the +load
 * generation.
 *
 */
#define ABI48_0_0RCT_EXPORT_PRE_REGISTERED_MODULE(js_name) \
  +(NSString *)moduleName                         \
  {                                               \
    return @ #js_name;                            \
  }

// Implemented by ABI48_0_0RCT_EXPORT_MODULE
+ (NSString *)moduleName;

@optional

/**
 * A reference to the ABI48_0_0RCTModuleRegistry. Useful for modules that require access
 * to other NativeModules. To implement this in your module, just add `@synthesize
 * moduleRegistry = _moduleRegistry;`. If using Swift, add
 * `@objc var moduleRegistry: ABI48_0_0RCTModuleRegistry!` to your module.
 */
@property (nonatomic, weak, readwrite) ABI48_0_0RCTModuleRegistry *moduleRegistry;

/**
 * A reference to the ABI48_0_0RCTViewRegistry. Useful for modules that query UIViews,
 * given a ABI48_0_0React tag. This API is deprecated, and only exists to help migrate
 * NativeModules to Venice.
 *
 * To implement this in your module, just add `@synthesize
 * viewRegistry_DEPRECATED = _viewRegistry_DEPRECATED;`. If using Swift, add
 * `@objc var viewRegistry_DEPRECATED: ABI48_0_0RCTViewRegistry!` to your module.
 */
@property (nonatomic, weak, readwrite) ABI48_0_0RCTViewRegistry *viewRegistry_DEPRECATED;

/**
 * A reference to the ABI48_0_0RCTBundleManager. Useful for modules that need to read
 * or write to the app's bundle URL.
 *
 * To implement this in your module, just add `@synthesize bundleManager =
 * _bundleManager;`. If using Swift, add `@objc var bundleManager:
 * ABI48_0_0RCTBundleManager!` to your module.
 */
@property (nonatomic, weak, readwrite) ABI48_0_0RCTBundleManager *bundleManager;

/**
 * A reference to an ABI48_0_0RCTCallableJSModules. Useful for modules that need to
 * call into methods on JavaScript modules registered as callable with
 * ABI48_0_0React Native.
 *
 * To implement this in your module, just add `@synthesize callableJSModules =
 * _callableJSModules;`. If using Swift, add `@objc var callableJSModules:
 * ABI48_0_0RCTCallableJSModules!` to your module.
 */
@property (nonatomic, weak, readwrite) ABI48_0_0RCTCallableJSModules *callableJSModules;

/**
 * A reference to the ABI48_0_0RCTBridge. Useful for modules that require access
 * to bridge features, such as sending events or making JS calls. This
 * will be set automatically by the bridge when it initializes the module.
 * To implement this in your module, just add `@synthesize bridge = _bridge;`
 * If using Swift, add `@objc var bridge: ABI48_0_0RCTBridge!` to your module.
 */
@property (nonatomic, weak, readonly) ABI48_0_0RCTBridge *bridge;

/**
 * The queue that will be used to call all exported methods. If omitted, this
 * will call on a default background queue, which is avoids blocking the main
 * thread.
 *
 * If the methods in your module need to interact with UIKit methods, they will
 * probably need to call those on the main thread, as most of UIKit is main-
 * thread-only. You can tell ABI48_0_0React Native to call your module methods on the
 * main thread by returning a reference to the main queue, like this:
 *
 * - (dispatch_queue_t)methodQueue
 * {
 *   return dispatch_get_main_queue();
 * }
 *
 * If you don't want to specify the queue yourself, but you need to use it
 * inside your class (e.g. if you have internal methods that need to dispatch
 * onto that queue), you can just add `@synthesize methodQueue = _methodQueue;`
 * and the bridge will populate the methodQueue property for you automatically
 * when it initializes the module.
 */
@property (nonatomic, strong, readonly) dispatch_queue_t methodQueue;

/**
 * Wrap the parameter line of your method implementation with this macro to
 * expose it to JS. By default the exposed method will match the first part of
 * the Objective-C method selector name (up to the first colon). Use
 * ABI48_0_0RCT_REMAP_METHOD to specify the JS name of the method.
 *
 * For example, in ModuleName.m:
 *
 * - (void)doSomething:(NSString *)aString withA:(NSInteger)a andB:(NSInteger)b
 * { ... }
 *
 * becomes
 *
 * ABI48_0_0RCT_EXPORT_METHOD(doSomething:(NSString *)aString
 *                   withA:(NSInteger)a
 *                   andB:(NSInteger)b)
 * { ... }
 *
 * and is exposed to JavaScript as `NativeModules.ModuleName.doSomething`.
 *
 * ## Promises
 *
 * Bridge modules can also define methods that are exported to JavaScript as
 * methods that return a Promise, and are compatible with JS async functions.
 *
 * Declare the last two parameters of your native method to be a resolver block
 * and a rejecter block. The resolver block must precede the rejecter block.
 *
 * For example:
 *
 * ABI48_0_0RCT_EXPORT_METHOD(doSomethingAsync:(NSString *)aString
 *                           resolver:(ABI48_0_0RCTPromiseResolveBlock)resolve
 *                           rejecter:(ABI48_0_0RCTPromiseRejectBlock)reject
 * { ... }
 *
 * Calling `NativeModules.ModuleName.doSomethingAsync(aString)` from
 * JavaScript will return a promise that is resolved or rejected when your
 * native method implementation calls the respective block.
 *
 */
#define ABI48_0_0RCT_EXPORT_METHOD(method) ABI48_0_0RCT_REMAP_METHOD(, method)

/**
 * Same as ABI48_0_0RCT_EXPORT_METHOD but the method is called from JS
 * synchronously **on the JS thread**, possibly returning a result.
 *
 * WARNING: in the vast majority of cases, you should use ABI48_0_0RCT_EXPORT_METHOD which
 * allows your native module methods to be called asynchronously: calling
 * methods synchronously can have strong performance penalties and introduce
 * threading-related bugs to your native modules.
 *
 * The return type must be of object type (id) and should be serializable
 * to JSON. This means that the hook can only return nil or JSON values
 * (e.g. NSNumber, NSString, NSArray, NSDictionary).
 *
 * Calling these methods when running under the websocket executor
 * is currently not supported.
 */
#define ABI48_0_0RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(method) ABI48_0_0RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(id, method)

#define ABI48_0_0RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(returnType, method) \
  ABI48_0_0RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(, returnType, method)

/**
 * Similar to ABI48_0_0RCT_EXPORT_METHOD but lets you set the JS name of the exported
 * method. Example usage:
 *
 * ABI48_0_0RCT_REMAP_METHOD(executeQueryWithParameters,
 *   executeQuery:(NSString *)query parameters:(NSDictionary *)parameters)
 * { ... }
 */
#define ABI48_0_0RCT_REMAP_METHOD(js_name, method)       \
  _ABI48_0_0RCT_EXTERN_REMAP_METHOD(js_name, method, NO) \
  -(void)method ABI48_0_0RCT_DYNAMIC;

/**
 * Similar to ABI48_0_0RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD but lets you set
 * the JS name of the exported method. Example usage:
 *
 * ABI48_0_0RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(executeQueryWithParameters,
 *   executeQuery:(NSString *)query parameters:(NSDictionary *)parameters)
 * { ... }
 */
#define ABI48_0_0RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(js_name, returnType, method) \
  _ABI48_0_0RCT_EXTERN_REMAP_METHOD(js_name, method, YES)                           \
  -(returnType)method ABI48_0_0RCT_DYNAMIC;

/**
 * Use this macro in a private Objective-C implementation file to automatically
 * register an external module with the bridge when it loads. This allows you to
 * register Swift or private Objective-C classes with the bridge.
 *
 * For example if one wanted to export a Swift class to the bridge:
 *
 * MyModule.swift:
 *
 *   @objc(MyModule) class MyModule: NSObject {
 *
 *     @objc func doSomething(string: String! withFoo a: Int, bar b: Int) { ... }
 *
 *   }
 *
 * MyModuleExport.m:
 *
 *   #import <ABI48_0_0React/ABI48_0_0RCTBridgeModule.h>
 *
 *   @interface ABI48_0_0RCT_EXTERN_MODULE(MyModule, NSObject)
 *
 *   ABI48_0_0RCT_EXTERN_METHOD(doSomething:(NSString *)string withFoo:(NSInteger)a bar:(NSInteger)b)
 *
 *   @end
 *
 * This will now expose MyModule and the method to JavaScript via
 * `NativeModules.MyModule.doSomething`
 */
#define ABI48_0_0RCT_EXTERN_MODULE(objc_name, objc_supername) ABI48_0_0RCT_EXTERN_REMAP_MODULE(, objc_name, objc_supername)

/**
 * Like ABI48_0_0RCT_EXTERN_MODULE, but allows setting a custom JavaScript name.
 */
#define ABI48_0_0RCT_EXTERN_REMAP_MODULE(js_name, objc_name, objc_supername) \
  objc_name:                                                        \
  objc_supername @                                                  \
  end @interface objc_name(ABI48_0_0RCTExternModule)<ABI48_0_0RCTBridgeModule>        \
  @end                                                              \
  @implementation objc_name (ABI48_0_0RCTExternModule)                       \
  ABI48_0_0RCT_EXPORT_MODULE_NO_LOAD(js_name, objc_name)

/**
 * Use this macro in accordance with ABI48_0_0RCT_EXTERN_MODULE to export methods
 * of an external module.
 */
#define ABI48_0_0RCT_EXTERN_METHOD(method) _ABI48_0_0RCT_EXTERN_REMAP_METHOD(, method, NO)

/**
 * Use this macro in accordance with ABI48_0_0RCT_EXTERN_MODULE to export methods
 * of an external module that should be invoked synchronously.
 */
#define ABI48_0_0RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(method) _ABI48_0_0RCT_EXTERN_REMAP_METHOD(, method, YES)

/**
 * Like ABI48_0_0RCT_EXTERN_REMAP_METHOD, but allows setting a custom JavaScript name
 * and also whether this method is synchronous.
 */
#define _ABI48_0_0RCT_EXTERN_REMAP_METHOD(js_name, method, is_blocking_synchronous_method)                            \
  +(const ABI48_0_0RCTMethodInfo *)ABI48_0_0RCT_CONCAT(__rct_export__, ABI48_0_0RCT_CONCAT(js_name, ABI48_0_0RCT_CONCAT(__LINE__, __COUNTER__))) \
  {                                                                                                          \
    static ABI48_0_0RCTMethodInfo config = {#js_name, #method, is_blocking_synchronous_method};                       \
    return &config;                                                                                          \
  }

/**
 * Most modules can be used from any thread. All of the modules exported non-sync method will be called on its
 * methodQueue, and the module will be constructed lazily when its first invoked. Some modules have main need to access
 * information that's main queue only (e.g. most UIKit classes). Since we don't want to dispatch synchronously to the
 * main thread to this safely, we construct these modules and export their constants ahead-of-time.
 *
 * Note that when set to false, the module constructor will be called from any thread.
 *
 * This requirement is currently inferred by checking if the module has a custom initializer or if there's exported
 * constants. In the future, we'll stop automatically inferring this and instead only rely on this method.
 */
+ (BOOL)requiresMainQueueSetup;

/**
 * Injects methods into JS.  Entries in this array are used in addition to any
 * methods defined using the macros above.  This method is called only once,
 * before registration.
 */
- (NSArray<id<ABI48_0_0RCTBridgeMethod>> *)methodsToExport;

/**
 * Injects constants into JS. These constants are made accessible via NativeModules.ModuleName.X. It is only called once
 * for the lifetime of the bridge, so it is not suitable for returning dynamic values, but may be used for long-lived
 * values such as session keys, that are regenerated only as part of a reload of the entire ABI48_0_0React application.
 *
 * If you implement this method and do not implement `requiresMainQueueSetup`, you will trigger deprecated logic
 * that eagerly initializes your module on bridge startup. In the future, this behaviour will be changed to default
 * to initializing lazily, and even modules with constants will be initialized lazily.
 */
- (NSDictionary *)constantsToExport;

/**
 * Notifies the module that a batch of JS method invocations has just completed.
 */
- (void)batchDidComplete;

/**
 * Notifies the module that the active batch of JS method invocations has been
 * partially flushed.
 *
 * This occurs before -batchDidComplete, and more frequently.
 */
- (void)partialBatchDidFlush;

@end

/**
 * A class that allows NativeModules and TurboModules to look up one another.
 */
@interface ABI48_0_0RCTModuleRegistry : NSObject
- (void)setBridge:(ABI48_0_0RCTBridge *)bridge;
- (void)setTurboModuleRegistry:(id<ABI48_0_0RCTTurboModuleRegistry>)turboModuleRegistry;

- (id)moduleForName:(const char *)moduleName;
- (id)moduleForName:(const char *)moduleName lazilyLoadIfNecessary:(BOOL)lazilyLoad;
@end

typedef UIView * (^ABI48_0_0RCTBridgelessComponentViewProvider)(NSNumber *);

typedef void (^ABI48_0_0RCTViewRegistryUIBlock)(ABI48_0_0RCTViewRegistry *viewRegistry);

/**
 * A class that allows NativeModules to query for views, given ABI48_0_0React Tags.
 */
@interface ABI48_0_0RCTViewRegistry : NSObject
- (void)setBridge:(ABI48_0_0RCTBridge *)bridge;
- (void)setBridgelessComponentViewProvider:(ABI48_0_0RCTBridgelessComponentViewProvider)bridgelessComponentViewProvider;

- (UIView *)viewForABI48_0_0ReactTag:(NSNumber *)ABI48_0_0ReactTag;
- (void)addUIBlock:(ABI48_0_0RCTViewRegistryUIBlock)block;
@end

typedef void (^ABI48_0_0RCTBridgelessJSModuleMethodInvoker)(
    NSString *moduleName,
    NSString *methodName,
    NSArray *args,
    dispatch_block_t onComplete);

/**
 * A class that allows NativeModules to call methods on JavaScript modules registered
 * as callable with ABI48_0_0React Native.
 */
@interface ABI48_0_0RCTCallableJSModules : NSObject
- (void)setBridge:(ABI48_0_0RCTBridge *)bridge;
- (void)setBridgelessJSModuleMethodInvoker:(ABI48_0_0RCTBridgelessJSModuleMethodInvoker)bridgelessJSModuleMethodInvoker;

- (void)invokeModule:(NSString *)moduleName method:(NSString *)methodName withArgs:(NSArray *)args;
- (void)invokeModule:(NSString *)moduleName
              method:(NSString *)methodName
            withArgs:(NSArray *)args
          onComplete:(dispatch_block_t)onComplete;
@end
