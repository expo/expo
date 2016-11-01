/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <JavaScriptCore/JavaScriptCore.h>

#import "ABI11_0_0RCTJavaScriptExecutor.h"

typedef void (^ABI11_0_0RCTJavaScriptValueCallback)(JSValue *result, NSError *error);

/**
 * Default name for the JS thread
 */
ABI11_0_0RCT_EXTERN NSString *const ABI11_0_0RCTJSCThreadName;

/**
 * This notification fires on the JS thread immediately after a `JSContext`
 * is fully initialized, but before the JS bundle has been loaded. The object
 * of this notification is the `JSContext`. Native modules should listen for
 * notification only if they need to install custom functionality into the
 * context. Note that this notification won't fire when debugging in Chrome.
 */
ABI11_0_0RCT_EXTERN NSString *const ABI11_0_0RCTJavaScriptContextCreatedNotification;

/**
 * A key to a reference to a JSContext class, held in the the current thread's
 *  dictionary. The reference would point to the JSContext class in the JS VM
 *  used in ReactABI11_0_0 (or ComponenetScript). It is recommended not to access it
 *  through the thread's dictionary, but rather to use the `FBJSCurrentContext()`
 *  accessor, which will return the current JSContext in the currently used VM.
 */
ABI11_0_0RCT_EXTERN NSString *const ABI11_0_0RCTFBJSContextClassKey;

/**
 * A key to a reference to a JSValue class, held in the the current thread's
 *  dictionary. The reference would point to the JSValue class in the JS VM
 *  used in ReactABI11_0_0 (or ComponenetScript). It is recommended not to access it
 *  through the thread's dictionary, but rather to use the `FBJSValue()` accessor.
 */
ABI11_0_0RCT_EXTERN NSString *const ABI11_0_0RCTFBJSValueClassKey;

/**
 * @experimental
 * May be used to pre-create the JSContext to make ABI11_0_0RCTJSCExecutor creation less costly.
 * Avoid using this; it's experimental and is not likely to be supported long-term.
 */
@interface ABI11_0_0RCTJSContextProvider : NSObject

- (instancetype)initWithUseCustomJSCLibrary:(BOOL)useCustomJSCLibrary;

/**
 * Marks whether the provider uses the custom implementation of JSC and not the system one.
 */
@property (nonatomic, readonly, assign) BOOL useCustomJSCLibrary;

@end

/**
 * Uses a JavaScriptCore context as the execution engine.
 */
@interface ABI11_0_0RCTJSCExecutor : NSObject <ABI11_0_0RCTJavaScriptExecutor>

/**
 * Returns whether executor uses custom JSC library.
 * This value is used to initialize ABI11_0_0RCTJSCWrapper.
 * @default is NO.
 */
@property (nonatomic, readonly, assign) BOOL useCustomJSCLibrary;

/**
 * Inits a new executor instance with given flag that's used
 * to initialize ABI11_0_0RCTJSCWrapper.
 */
- (instancetype)initWithUseCustomJSCLibrary:(BOOL)useCustomJSCLibrary;

/**
 * @experimental
 * Pass a ABI11_0_0RCTJSContextProvider object to use an NSThread/JSContext pair that have already been created.
 * The returned executor has already executed the supplied application script synchronously.
 * The underlying JSContext will be returned in the JSContext pointer if it is non-NULL and there was no error.
 * If an error occurs, this method will return nil and specify the error in the error pointer if it is non-NULL.
 */
+ (instancetype)initializedExecutorWithContextProvider:(ABI11_0_0RCTJSContextProvider *)JSContextProvider
                                     applicationScript:(NSData *)applicationScript
                                             sourceURL:(NSURL *)sourceURL
                                             JSContext:(JSContext **)JSContext
                                                 error:(NSError **)error;

/**
 * Invokes the given module/method directly. The completion block will be called with the
 * JSValue returned by the JS context.
 *
 * Currently this does not flush the JS-to-native message queue.
 */
- (void)callFunctionOnModule:(NSString *)module
                      method:(NSString *)method
                   arguments:(NSArray *)args
             jsValueCallback:(ABI11_0_0RCTJavaScriptValueCallback)onComplete;

/**
 * Get the JavaScriptCore context associated with this executor instance.
 */
- (JSContext *)jsContext;

@end
