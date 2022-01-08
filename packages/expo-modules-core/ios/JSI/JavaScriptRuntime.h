// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/JavaScriptObject.h>

#ifdef __cplusplus
#import <ReactCommon/CallInvoker.h>
#endif

@interface JavaScriptRuntime : NSObject

#ifdef __cplusplus
typedef jsi::Value (^JSHostFunctionBlock)(jsi::Runtime &runtime, std::shared_ptr<react::CallInvoker> callInvoker, NSArray * _Nonnull arguments);

- (nonnull instancetype)initWithRuntime:(jsi::Runtime &)runtime
                            callInvoker:(std::shared_ptr<react::CallInvoker>)callInvoker;

/**
 Returns the underlying runtime object.
 */
- (nullable jsi::Runtime *)get;

/**
 Returns the call invoker the runtime was initialized with.
 */
- (std::shared_ptr<react::CallInvoker>)callInvoker;

/**
 Wraps given host object to `JavaScriptObject`.
 */
- (nonnull JavaScriptObject *)createHostObject:(std::shared_ptr<jsi::HostObject>)jsiHostObjectPtr;

- (jsi::Function)createSyncFunction:(nonnull NSString *)name
                          argsCount:(NSInteger)argsCount
                              block:(nonnull JSSyncFunctionBlock)block;

- (jsi::Function)createAsyncFunction:(nonnull NSString *)name
                           argsCount:(NSInteger)argsCount
                               block:(nonnull JSAsyncFunctionBlock)block;

#endif

/**
 Returns the runtime global object for use in Swift.
 */
- (nonnull JavaScriptObject *)global;

/**
 Creates a new object for use in Swift.
 */
- (nonnull JavaScriptObject *)createObject;

@end
