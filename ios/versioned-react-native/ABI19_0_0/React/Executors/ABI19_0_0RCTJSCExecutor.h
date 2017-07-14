/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <JavaScriptCore/JavaScriptCore.h>

#import <ReactABI19_0_0/ABI19_0_0RCTJavaScriptExecutor.h>

typedef void (^ABI19_0_0RCTJavaScriptValueCallback)(JSValue *result, NSError *error);

/**
 * Default name for the JS thread
 */
ABI19_0_0RCT_EXTERN NSString *const ABI19_0_0RCTJSCThreadName;

/**
 * This notification fires on the JS thread immediately after a `JSContext`
 * is fully initialized, but before the JS bundle has been loaded. The object
 * of this notification is the `JSContext`. Native modules should listen for
 * notification only if they need to install custom functionality into the
 * context. Note that this notification won't fire when debugging in Chrome.
 */
ABI19_0_0RCT_EXTERN NSString *const ABI19_0_0RCTJavaScriptContextCreatedNotification;

/**
 * Uses a JavaScriptCore context as the execution engine.
 */
@interface ABI19_0_0RCTJSCExecutor : NSObject <ABI19_0_0RCTJavaScriptExecutor>

/**
 * Returns whether executor uses custom JSC library.
 * This value is used to initialize ABI19_0_0RCTJSCWrapper.
 * @default is NO.
 */
@property (nonatomic, readonly, assign) BOOL useCustomJSCLibrary;

/**
 * Returns the bytecode file format that the underlying runtime supports.
 */
@property (nonatomic, readonly) int32_t bytecodeFileFormatVersion;

/**
 * Specify a name for the JSContext used, which will be visible in debugging tools
 * @default is "ABI19_0_0RCTJSContext"
 */
@property (nonatomic, copy) NSString *contextName;

/**
 * Inits a new executor instance with given flag that's used
 * to initialize ABI19_0_0RCTJSCWrapper.
 */
- (instancetype)initWithUseCustomJSCLibrary:(BOOL)useCustomJSCLibrary;

/**
 * @experimental
 * synchronouslyExecuteApplicationScript:sourceURL:JSContext:error:
 *
 * Run the provided JS Script/Bundle, blocking the caller until it finishes.
 * If there is an error during execution, it is returned, otherwise `NULL` is
 * returned.
 */
- (NSError *)synchronouslyExecuteApplicationScript:(NSData *)script
                                         sourceURL:(NSURL *)sourceURL;

/**
 * Invokes the given module/method directly. The completion block will be called with the
 * JSValue returned by the JS context.
 *
 * Currently this does not flush the JS-to-native message queue.
 */
- (void)callFunctionOnModule:(NSString *)module
                      method:(NSString *)method
                   arguments:(NSArray *)args
             jsValueCallback:(ABI19_0_0RCTJavaScriptValueCallback)onComplete;

/**
 * Get the JavaScriptCore context associated with this executor instance.
 */
- (JSContext *)jsContext;

@end

/**
 * @experimental
 * May be used to pre-create the JSContext to make ABI19_0_0RCTJSCExecutor creation less costly.
 * Avoid using this; it's experimental and is not likely to be supported long-term.
 */
@interface ABI19_0_0RCTJSContextProvider : NSObject

- (instancetype)initWithUseCustomJSCLibrary:(BOOL)useCustomJSCLibrary;

/**
 * Marks whether the provider uses the custom implementation of JSC and not the system one.
 */
@property (nonatomic, readonly, assign) BOOL useCustomJSCLibrary;

/**
 * @experimental
 * Create an ABI19_0_0RCTJSCExecutor from an provider instance. This may only be called once.
 * The underlying JSContext will be returned in the JSContext pointer if it is non-NULL.
 */
- (ABI19_0_0RCTJSCExecutor *)createExecutorWithContext:(JSContext **)JSContext;

@end
