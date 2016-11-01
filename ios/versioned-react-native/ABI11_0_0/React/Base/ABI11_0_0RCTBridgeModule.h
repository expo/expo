/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import "ABI11_0_0RCTDefines.h"

@class ABI11_0_0RCTBridge;
@protocol ABI11_0_0RCTBridgeMethod;

/**
 * The type of a block that is capable of sending a response to a bridged
 * operation. Use this for returning callback methods to JS.
 */
typedef void (^ABI11_0_0RCTResponseSenderBlock)(NSArray *response);

/**
 * The type of a block that is capable of sending an error response to a
 * bridged operation. Use this for returning error information to JS.
 */
typedef void (^ABI11_0_0RCTResponseErrorBlock)(NSError *error);

/**
 * Block that bridge modules use to resolve the JS promise waiting for a result.
 * Nil results are supported and are converted to JS's undefined value.
 */
typedef void (^ABI11_0_0RCTPromiseResolveBlock)(id result);

/**
 * Block that bridge modules use to reject the JS promise waiting for a result.
 * The error may be nil but it is preferable to pass an NSError object for more
 * precise error messages.
 */
typedef void (^ABI11_0_0RCTPromiseRejectBlock)(NSString *code, NSString *message, NSError *error);

/**
 * This constant can be returned from +methodQueue to force module
 * methods to be called on the JavaScript thread. This can have serious
 * implications for performance, so only use this if you're sure it's what
 * you need.
 *
 * NOTE: ABI11_0_0RCTJSThread is not a real libdispatch queue
 */
extern dispatch_queue_t ABI11_0_0RCTJSThread;

/**
 * Provides the interface needed to register a bridge module.
 */
@protocol ABI11_0_0RCTBridgeModule <NSObject>

/**
 * Place this macro in your class implementation to automatically register
 * your module with the bridge when it loads. The optional js_name argument
 * will be used as the JS module name. If omitted, the JS module name will
 * match the Objective-C class name.
 */
#define ABI11_0_0RCT_EXPORT_MODULE(js_name) \
ABI11_0_0RCT_EXTERN void ABI11_0_0RCTRegisterModule(Class); \
+ (NSString *)moduleName { return @#js_name; } \
+ (void)load { ABI11_0_0RCTRegisterModule(self); }

// Implemented by ABI11_0_0RCT_EXPORT_MODULE
+ (NSString *)moduleName;

@optional

/**
 * A reference to the ABI11_0_0RCTBridge. Useful for modules that require access
 * to bridge features, such as sending events or making JS calls. This
 * will be set automatically by the bridge when it initializes the module.
 * To implement this in your module, just add `@synthesize bridge = _bridge;`
 */
@property (nonatomic, weak, readonly) ABI11_0_0RCTBridge *bridge;

/**
 * The queue that will be used to call all exported methods. If omitted, this
 * will call on a default background queue, which is avoids blocking the main
 * thread.
 *
 * If the methods in your module need to interact with UIKit methods, they will
 * probably need to call those on the main thread, as most of UIKit is main-
 * thread-only. You can tell ReactABI11_0_0 Native to call your module methods on the
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
 * ABI11_0_0RCT_REMAP_METHOD to specify the JS name of the method.
 *
 * For example, in ModuleName.m:
 *
 * - (void)doSomething:(NSString *)aString withA:(NSInteger)a andB:(NSInteger)b
 * { ... }
 *
 * becomes
 *
 * ABI11_0_0RCT_EXPORT_METHOD(doSomething:(NSString *)aString
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
 * ABI11_0_0RCT_EXPORT_METHOD(doSomethingAsync:(NSString *)aString
 *                           resolver:(ABI11_0_0RCTPromiseResolveBlock)resolve
 *                           rejecter:(ABI11_0_0RCTPromiseRejectBlock)reject
 * { ... }
 *
 * Calling `NativeModules.ModuleName.doSomethingAsync(aString)` from
 * JavaScript will return a promise that is resolved or rejected when your
 * native method implementation calls the respective block.
 *
 */
#define ABI11_0_0RCT_EXPORT_METHOD(method) \
  ABI11_0_0RCT_REMAP_METHOD(, method)

/**
 * Similar to ABI11_0_0RCT_EXPORT_METHOD but lets you set the JS name of the exported
 * method. Example usage:
 *
 * ABI11_0_0RCT_REMAP_METHOD(executeQueryWithParameters,
 *   executeQuery:(NSString *)query parameters:(NSDictionary *)parameters)
 * { ... }
 */
#define ABI11_0_0RCT_REMAP_METHOD(js_name, method) \
  ABI11_0_0RCT_EXTERN_REMAP_METHOD(js_name, method) \
  - (void)method

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
 *   #import "ABI11_0_0RCTBridgeModule.h"
 *
 *   @interface ABI11_0_0RCT_EXTERN_MODULE(MyModule, NSObject)
 *
 *   ABI11_0_0RCT_EXTERN_METHOD(doSomething:(NSString *)string withFoo:(NSInteger)a bar:(NSInteger)b)
 *
 *   @end
 *
 * This will now expose MyModule and the method to JavaScript via
 * `NativeModules.MyModule.doSomething`
 */
#define ABI11_0_0RCT_EXTERN_MODULE(objc_name, objc_supername) \
  ABI11_0_0RCT_EXTERN_REMAP_MODULE(, objc_name, objc_supername)

/**
 * Like ABI11_0_0RCT_EXTERN_MODULE, but allows setting a custom JavaScript name.
 */
#define ABI11_0_0RCT_EXTERN_REMAP_MODULE(js_name, objc_name, objc_supername) \
  objc_name : objc_supername \
  @end \
  @interface objc_name (ABI11_0_0RCTExternModule) <ABI11_0_0RCTBridgeModule> \
  @end \
  @implementation objc_name (ABI11_0_0RCTExternModule) \
  ABI11_0_0RCT_EXPORT_MODULE(js_name)

/**
 * Use this macro in accordance with ABI11_0_0RCT_EXTERN_MODULE to export methods
 * of an external module.
 */
#define ABI11_0_0RCT_EXTERN_METHOD(method) \
  ABI11_0_0RCT_EXTERN_REMAP_METHOD(, method)

/**
 * Like ABI11_0_0RCT_EXTERN_REMAP_METHOD, but allows setting a custom JavaScript name.
 */
#define ABI11_0_0RCT_EXTERN_REMAP_METHOD(js_name, method) \
  + (NSArray<NSString *> *)ABI11_0_0RCT_CONCAT(__rct_export__, \
    ABI11_0_0RCT_CONCAT(js_name, ABI11_0_0RCT_CONCAT(__LINE__, __COUNTER__))) { \
    return @[@#js_name, @#method]; \
  }

/**
 * Injects methods into JS.  Entries in this array are used in addition to any
 * methods defined using the macros above.  This method is called only once,
 * before registration.
 */
- (NSArray<id<ABI11_0_0RCTBridgeMethod>> *)methodsToExport;

/**
 * Injects constants into JS. These constants are made accessible via
 * NativeModules.ModuleName.X.  It is only called once for the lifetime of the
 * bridge, so it is not suitable for returning dynamic values, but may be used
 * for long-lived values such as session keys, that are regenerated only as
 * part of a reload of the entire ReactABI11_0_0 application.
 */
- (NSDictionary<NSString *, id> *)constantsToExport;

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
