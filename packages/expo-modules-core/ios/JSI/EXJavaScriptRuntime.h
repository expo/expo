// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ExpoModulesCore/EXJavaScriptValue.h>
#import <ExpoModulesCore/EXJavaScriptObject.h>
#import <React/RCTBridgeModule.h>

#ifdef __cplusplus
#import <ReactCommon/CallInvoker.h>

namespace jsi = facebook::jsi;
namespace react = facebook::react;
#endif // __cplusplus

@class EXJavaScriptValue;
@class EXJavaScriptObject;
@class EXJavaScriptSharedObject;

typedef void (^JSRuntimeExecutionBlock)();

typedef void (^JSAsyncFunctionBlock)(EXJavaScriptValue * _Nonnull thisValue,
                                     NSArray<EXJavaScriptValue *> * _Nonnull arguments,
                                     RCTPromiseResolveBlock _Nonnull resolve,
                                     RCTPromiseRejectBlock _Nonnull reject);

typedef id _Nullable (^JSSyncFunctionBlock)(EXJavaScriptValue * _Nonnull thisValue,
                                            NSArray<EXJavaScriptValue *> * _Nonnull arguments,
                                            NSError * _Nullable __autoreleasing * _Nullable error);

#ifdef __cplusplus
typedef jsi::Value (^JSHostFunctionBlock)(jsi::Runtime &runtime,
                                          std::shared_ptr<react::CallInvoker> callInvoker,
                                          EXJavaScriptValue * _Nonnull thisValue,
                                          NSArray<EXJavaScriptValue *> * _Nonnull arguments);
#endif // __cplusplus

NS_SWIFT_NAME(JavaScriptRuntime)
@interface EXJavaScriptRuntime : NSObject

/**
 Creates a new JavaScript runtime.
 */
- (nonnull instancetype)init;

#ifdef __cplusplus

- (nonnull instancetype)initWithRuntime:(nonnull jsi::Runtime *)runtime
                            callInvoker:(std::shared_ptr<react::CallInvoker>)callInvoker;

/**
 Returns the underlying runtime object.
 */
- (nonnull jsi::Runtime *)get;

/**
 Returns the call invoker the runtime was initialized with.
 */
- (std::shared_ptr<react::CallInvoker>)callInvoker;

/**
 Wraps given host object to `EXJavaScriptObject`.
 */
- (nonnull EXJavaScriptObject *)createHostObject:(std::shared_ptr<jsi::HostObject>)jsiHostObjectPtr;

#endif // __cplusplus

/**
 Returns the runtime global object for use in Swift.
 */
- (nonnull EXJavaScriptObject *)global;

/**
 Creates a new object for use in Swift.
 */
- (nonnull EXJavaScriptObject *)createObject;

/**
 Creates a synchronous host function that runs given block when it's called.
 The value returned by the block is synchronously returned to JS.
 \return A JavaScript function represented as a `JavaScriptObject`.
 */
- (nonnull EXJavaScriptObject *)createSyncFunction:(nonnull NSString *)name
                                         argsCount:(NSInteger)argsCount
                                             block:(nonnull JSSyncFunctionBlock)block NS_REFINED_FOR_SWIFT;

/**
 Creates an asynchronous host function that runs given block when it's called.
 The block receives a resolver that you should call when the asynchronous operation
 succeeds and a rejecter to call whenever it fails.
 \return A JavaScript function represented as a `JavaScriptObject`.
 */
- (nonnull EXJavaScriptObject *)createAsyncFunction:(nonnull NSString *)name
                                          argsCount:(NSInteger)argsCount
                                              block:(nonnull JSAsyncFunctionBlock)block;

#pragma mark - Classes

typedef void (^ClassConstructorBlock)(EXJavaScriptObject * _Nonnull thisValue, NSArray<EXJavaScriptValue *> * _Nonnull arguments);

- (nonnull EXJavaScriptObject *)createClass:(nonnull NSString *)name
                                constructor:(nonnull ClassConstructorBlock)constructor;

/**
 Creates a new object, using the provided object as the prototype.
 */
- (nullable EXJavaScriptObject *)createObjectWithPrototype:(nonnull EXJavaScriptObject *)prototype;

#pragma mark - Shared objects

- (nonnull EXJavaScriptObject *)createSharedObjectClass:(nonnull NSString *)name
                                            constructor:(nonnull ClassConstructorBlock)constructor;

#pragma mark - Script evaluation

/**
 Evaluates given JavaScript source code.
 */
- (nonnull EXJavaScriptValue *)evaluateScript:(nonnull NSString *)scriptSource NS_REFINED_FOR_SWIFT;

#pragma mark - Runtime execution

/**
 Schedules a block to be executed with granted synchronized access to the JS runtime.
 */
- (void)schedule:(nonnull JSRuntimeExecutionBlock)block priority:(int)priority NS_REFINED_FOR_SWIFT;

@end
