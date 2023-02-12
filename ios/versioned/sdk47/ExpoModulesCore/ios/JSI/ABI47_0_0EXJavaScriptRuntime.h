// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXJavaScriptValue.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXJavaScriptObject.h>
#import <ABI47_0_0React/ABI47_0_0RCTBridgeModule.h>

#ifdef __cplusplus
#import <ABI47_0_0ReactCommon/ABI47_0_0CallInvoker.h>

namespace jsi = ABI47_0_0facebook::jsi;
namespace react = ABI47_0_0facebook::ABI47_0_0React;
#endif // __cplusplus

@class ABI47_0_0EXJavaScriptValue;
@class ABI47_0_0EXJavaScriptObject;

typedef void (^JSAsyncFunctionBlock)(ABI47_0_0EXJavaScriptValue * _Nonnull thisValue,
                                     NSArray<ABI47_0_0EXJavaScriptValue *> * _Nonnull arguments,
                                     ABI47_0_0RCTPromiseResolveBlock _Nonnull resolve,
                                     ABI47_0_0RCTPromiseRejectBlock _Nonnull reject);

typedef id _Nullable (^JSSyncFunctionBlock)(ABI47_0_0EXJavaScriptValue * _Nonnull thisValue,
                                            NSArray<ABI47_0_0EXJavaScriptValue *> * _Nonnull arguments,
                                            NSError * _Nullable __autoreleasing * _Nullable error);

#ifdef __cplusplus
typedef jsi::Value (^JSHostFunctionBlock)(jsi::Runtime &runtime,
                                          std::shared_ptr<react::CallInvoker> callInvoker,
                                          ABI47_0_0EXJavaScriptValue * _Nonnull thisValue,
                                          NSArray<ABI47_0_0EXJavaScriptValue *> * _Nonnull arguments);
#endif // __cplusplus

NS_SWIFT_NAME(JavaScriptRuntime)
@interface ABI47_0_0EXJavaScriptRuntime : NSObject

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
 Wraps given host object to `ABI47_0_0EXJavaScriptObject`.
 */
- (nonnull ABI47_0_0EXJavaScriptObject *)createHostObject:(std::shared_ptr<jsi::HostObject>)jsiHostObjectPtr;

#endif // __cplusplus

/**
 Returns the runtime global object for use in Swift.
 */
- (nonnull ABI47_0_0EXJavaScriptObject *)global;

/**
 The main object of the Expo runtime that is used to scope native Expo-specific functionalities.
 It gets installed into the runtime as the `global.expo` object.
 */
- (nonnull ABI47_0_0EXJavaScriptObject *)mainObject;

/**
 Creates a new object for use in Swift.
 */
- (nonnull ABI47_0_0EXJavaScriptObject *)createObject;

/**
 Creates a synchronous host function that runs given block when it's called.
 The value returned by the block is synchronously returned to JS.
 \return A JavaScript function represented as a `JavaScriptObject`.
 */
- (nonnull ABI47_0_0EXJavaScriptObject *)createSyncFunction:(nonnull NSString *)name
                                         argsCount:(NSInteger)argsCount
                                             block:(nonnull JSSyncFunctionBlock)block NS_REFINED_FOR_SWIFT;

/**
 Creates an asynchronous host function that runs given block when it's called.
 The block receives a resolver that you should call when the asynchronous operation
 succeeds and a rejecter to call whenever it fails.
 \return A JavaScript function represented as a `JavaScriptObject`.
 */
- (nonnull ABI47_0_0EXJavaScriptObject *)createAsyncFunction:(nonnull NSString *)name
                                          argsCount:(NSInteger)argsCount
                                              block:(nonnull JSAsyncFunctionBlock)block;

#pragma mark - Classes

typedef void (^ClassConstructorBlock)(ABI47_0_0EXJavaScriptObject * _Nonnull thisValue, NSArray<ABI47_0_0EXJavaScriptValue *> * _Nonnull arguments);

- (nonnull ABI47_0_0EXJavaScriptObject *)createClass:(nonnull NSString *)name
                                constructor:(nonnull ClassConstructorBlock)constructor;

#pragma mark - Script evaluation

/**
 Evaluates given JavaScript source code.
 */
- (nonnull ABI47_0_0EXJavaScriptValue *)evaluateScript:(nonnull NSString *)scriptSource NS_REFINED_FOR_SWIFT;

@end
