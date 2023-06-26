// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXJavaScriptValue.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXJavaScriptObject.h>
#import <ABI49_0_0React/ABI49_0_0RCTBridgeModule.h>

#ifdef __cplusplus
#import <ABI49_0_0ReactCommon/ABI49_0_0CallInvoker.h>

namespace jsi = ABI49_0_0facebook::jsi;
namespace react = ABI49_0_0facebook::ABI49_0_0React;
#endif // __cplusplus

@class ABI49_0_0EXJavaScriptValue;
@class ABI49_0_0EXJavaScriptObject;

typedef void (^JSAsyncFunctionBlock)(ABI49_0_0EXJavaScriptValue * _Nonnull thisValue,
                                     NSArray<ABI49_0_0EXJavaScriptValue *> * _Nonnull arguments,
                                     ABI49_0_0RCTPromiseResolveBlock _Nonnull resolve,
                                     ABI49_0_0RCTPromiseRejectBlock _Nonnull reject);

typedef id _Nullable (^JSSyncFunctionBlock)(ABI49_0_0EXJavaScriptValue * _Nonnull thisValue,
                                            NSArray<ABI49_0_0EXJavaScriptValue *> * _Nonnull arguments,
                                            NSError * _Nullable __autoreleasing * _Nullable error);

#ifdef __cplusplus
typedef jsi::Value (^JSHostFunctionBlock)(jsi::Runtime &runtime,
                                          std::shared_ptr<react::CallInvoker> callInvoker,
                                          ABI49_0_0EXJavaScriptValue * _Nonnull thisValue,
                                          NSArray<ABI49_0_0EXJavaScriptValue *> * _Nonnull arguments);
#endif // __cplusplus

NS_SWIFT_NAME(JavaScriptRuntime)
@interface ABI49_0_0EXJavaScriptRuntime : NSObject

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
 Wraps given host object to `ABI49_0_0EXJavaScriptObject`.
 */
- (nonnull ABI49_0_0EXJavaScriptObject *)createHostObject:(std::shared_ptr<jsi::HostObject>)jsiHostObjectPtr;

#endif // __cplusplus

/**
 Returns the runtime global object for use in Swift.
 */
- (nonnull ABI49_0_0EXJavaScriptObject *)global;

/**
 Creates a new object for use in Swift.
 */
- (nonnull ABI49_0_0EXJavaScriptObject *)createObject;

/**
 Creates a synchronous host function that runs given block when it's called.
 The value returned by the block is synchronously returned to JS.
 \return A JavaScript function represented as a `JavaScriptObject`.
 */
- (nonnull ABI49_0_0EXJavaScriptObject *)createSyncFunction:(nonnull NSString *)name
                                         argsCount:(NSInteger)argsCount
                                             block:(nonnull JSSyncFunctionBlock)block NS_REFINED_FOR_SWIFT;

/**
 Creates an asynchronous host function that runs given block when it's called.
 The block receives a resolver that you should call when the asynchronous operation
 succeeds and a rejecter to call whenever it fails.
 \return A JavaScript function represented as a `JavaScriptObject`.
 */
- (nonnull ABI49_0_0EXJavaScriptObject *)createAsyncFunction:(nonnull NSString *)name
                                          argsCount:(NSInteger)argsCount
                                              block:(nonnull JSAsyncFunctionBlock)block;

#pragma mark - Classes

typedef void (^ClassConstructorBlock)(ABI49_0_0EXJavaScriptObject * _Nonnull thisValue, NSArray<ABI49_0_0EXJavaScriptValue *> * _Nonnull arguments);

- (nonnull ABI49_0_0EXJavaScriptObject *)createClass:(nonnull NSString *)name
                                constructor:(nonnull ClassConstructorBlock)constructor;

/**
 Creates a new object, using the provided object as the prototype.
 */
- (nullable ABI49_0_0EXJavaScriptObject *)createObjectWithPrototype:(nonnull ABI49_0_0EXJavaScriptObject *)prototype;

#pragma mark - Script evaluation

/**
 Evaluates given JavaScript source code.
 */
- (nonnull ABI49_0_0EXJavaScriptValue *)evaluateScript:(nonnull NSString *)scriptSource NS_REFINED_FOR_SWIFT;

@end
