// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXJavaScriptValue.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXJavaScriptObject.h>

#ifdef __cplusplus
#import <ABI45_0_0ReactCommon/ABI45_0_0CallInvoker.h>

namespace jsi = ABI45_0_0facebook::jsi;
namespace react = ABI45_0_0facebook::ABI45_0_0React;
#endif // __cplusplus

@class ABI45_0_0EXJavaScriptValue;
@class ABI45_0_0EXJavaScriptObject;

#ifdef __cplusplus
typedef jsi::Value (^JSHostFunctionBlock)(jsi::Runtime &runtime, std::shared_ptr<react::CallInvoker> callInvoker, NSArray<ABI45_0_0EXJavaScriptValue *> * _Nonnull arguments);
#endif // __cplusplus

NS_SWIFT_NAME(JavaScriptRuntime)
@interface ABI45_0_0EXJavaScriptRuntime : NSObject

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
 Wraps given host object to `ABI45_0_0EXJavaScriptObject`.
 */
- (nonnull ABI45_0_0EXJavaScriptObject *)createHostObject:(std::shared_ptr<jsi::HostObject>)jsiHostObjectPtr;

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
- (nonnull ABI45_0_0EXJavaScriptObject *)global;

/**
 Creates a new object for use in Swift.
 */
- (nonnull ABI45_0_0EXJavaScriptObject *)createObject;

#pragma mark - Script evaluation

/**
 Evaluates given JavaScript source code.
 */
- (nonnull ABI45_0_0EXJavaScriptValue *)evaluateScript:(nonnull NSString *)scriptSource;

@end
