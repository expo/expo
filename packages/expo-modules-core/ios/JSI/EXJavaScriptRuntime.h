// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXJavaScriptValue.h>
#import <ExpoModulesCore/EXJavaScriptObject.h>

#ifdef __cplusplus
#import <ReactCommon/CallInvoker.h>

namespace jsi = facebook::jsi;
namespace react = facebook::react;
#endif // __cplusplus

@class EXJavaScriptValue;
@class EXJavaScriptObject;

#ifdef __cplusplus
typedef jsi::Value (^JSHostFunctionBlock)(jsi::Runtime &runtime, std::shared_ptr<react::CallInvoker> callInvoker, NSArray<EXJavaScriptValue *> * _Nonnull arguments);
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

- (jsi::Function)createSyncFunction:(nonnull NSString *)name
                          argsCount:(NSInteger)argsCount
                              block:(nonnull JSSyncFunctionBlock)block;

- (jsi::Function)createAsyncFunction:(nonnull NSString *)name
                           argsCount:(NSInteger)argsCount
                               block:(nonnull JSAsyncFunctionBlock)block;
#endif // __cplusplus

/**
 Returns the runtime global object for use in Swift.
 */
- (nonnull EXJavaScriptObject *)global;

/**
 Creates a new object for use in Swift.
 */
- (nonnull EXJavaScriptObject *)createObject;

#pragma mark - Script evaluation

/**
 Evaluates given JavaScript source code.
 */
- (nonnull EXJavaScriptValue *)evaluateScript:(nonnull NSString *)scriptSource;

@end
