// Copyright 2022-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

#ifdef __cplusplus
#import <jsi/jsi.h>
#import <ReactCommon/CallInvoker.h>

namespace jsi = facebook::jsi;
#endif // __cplusplus

typedef void (^JSAsyncFunctionBlock)(NSArray * _Nonnull, RCTPromiseResolveBlock _Nonnull, RCTPromiseRejectBlock _Nonnull);
typedef id _Nullable (^JSSyncFunctionBlock)(NSArray * _Nonnull);

@class JavaScriptRuntime;

@interface JavaScriptObject : NSObject

// Some parts of the interface must be hidden for Swift – it can't import any C++ code.
#ifdef __cplusplus
- (nonnull instancetype)initWith:(std::shared_ptr<jsi::Object>)jsObjectPtr
                         runtime:(nonnull JavaScriptRuntime *)runtime;

/**
 Returns the pointer to the underlying object.
 */
- (nonnull jsi::Object *)get;
#endif // __cplusplus

#pragma mark - Subscripting

/**
 Subscript getter. Supports only values convertible to Foundation types, otherwise `nil` is returned.
 */
- (nullable id)objectForKeyedSubscript:(nonnull NSString *)key;

/**
 Subscript setter. Only `JavaScriptObject` and Foundation object convertible to JSI values can be used as a value,
 otherwise the property is set to `undefined`.
 */
- (void)setObject:(nullable id)obj forKeyedSubscript:(nonnull NSString *)key;

#pragma mark - Functions

/**
 Sets given function block on the object as a host function returning a promise.
 */
- (void)setAsyncFunction:(nonnull NSString *)key
               argsCount:(NSInteger)argsCount
                   block:(nonnull JSAsyncFunctionBlock)block;

/**
 Sets given synchronous function block as a host function on the object.
 */
- (void)setSyncFunction:(nonnull NSString *)name
              argsCount:(NSInteger)argsCount
                  block:(nonnull JSSyncFunctionBlock)block;

@end
