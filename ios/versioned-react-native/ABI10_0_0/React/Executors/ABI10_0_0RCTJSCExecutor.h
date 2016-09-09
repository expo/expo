/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <JavaScriptCore/JavaScriptCore.h>

#import "ABI10_0_0RCTJavaScriptExecutor.h"

typedef void (^ABI10_0_0RCTJavaScriptValueCallback)(JSValue *result, NSError *error);

/**
 * Default name for the JS thread
 */
ABI10_0_0RCT_EXTERN NSString *const ABI10_0_0RCTJSCThreadName;

/**
 * This notification fires on the JS thread immediately after a `JSContext`
 * is fully initialized, but before the JS bundle has been loaded. The object
 * of this notification is the `JSContext`. Native modules should listen for
 * notification only if they need to install custom functionality into the
 * context. Note that this notification won't fire when debugging in Chrome.
 */
ABI10_0_0RCT_EXTERN NSString *const ABI10_0_0RCTJavaScriptContextCreatedNotification;

/**
 * @experimental
 * May be used to pre-create the JSContext to make ABI10_0_0RCTJSCExecutor creation less costly.
 * Avoid using this; it's experimental and is not likely to be supported long-term.
 */
@interface ABI10_0_0RCTJSContextProvider : NSObject

- (instancetype)initWithUseCustomJSCLibrary:(BOOL)useCustomJSCLibrary;

@end

/**
 * Uses a JavaScriptCore context as the execution engine.
 */
@interface ABI10_0_0RCTJSCExecutor : NSObject <ABI10_0_0RCTJavaScriptExecutor>

/**
 * Returns whether executor uses custom JSC library.
 * This value is used to initialize ABI10_0_0RCTJSCWrapper.
 * @default is NO.
 */
@property (nonatomic, readonly, assign) BOOL useCustomJSCLibrary;

/**
 * Inits a new executor instance with given flag that's used
 * to initialize ABI10_0_0RCTJSCWrapper.
 */
- (instancetype)initWithUseCustomJSCLibrary:(BOOL)useCustomJSCLibrary;

/**
 * Create a NSError from a JSError object.
 *
 * If available, the error's userInfo property will contain the JS stacktrace under
 * the ABI10_0_0RCTJSStackTraceKey key.
 */
- (NSError *)errorForJSError:(JSValue *)jsError;

/**
 * @experimental
 * Pass a ABI10_0_0RCTJSContextProvider object to use an NSThread/JSContext pair that have already been created.
 * The returned executor has already executed the supplied application script synchronously.
 * The underlying JSContext will be returned in the JSContext pointer if it is non-NULL and there was no error.
 * If an error occurs, this method will return nil and specify the error in the error pointer if it is non-NULL.
 */
+ (instancetype)initializedExecutorWithContextProvider:(ABI10_0_0RCTJSContextProvider *)JSContextProvider
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
             jsValueCallback:(ABI10_0_0RCTJavaScriptValueCallback)onComplete;

@end
