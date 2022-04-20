// Copyright 2022-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI45_0_0React/ABI45_0_0RCTBridgeModule.h>

#ifdef __cplusplus
#import <ABI45_0_0jsi/ABI45_0_0jsi.h>
#import <ABI45_0_0ReactCommon/ABI45_0_0CallInvoker.h>

namespace jsi = ABI45_0_0facebook::jsi;
#endif // __cplusplus

typedef void (^JSAsyncFunctionBlock)(NSArray * _Nonnull, ABI45_0_0RCTPromiseResolveBlock _Nonnull, ABI45_0_0RCTPromiseRejectBlock _Nonnull);
typedef id _Nullable (^JSSyncFunctionBlock)(NSArray * _Nonnull);

@class ABI45_0_0EXJavaScriptRuntime;
@class ABI45_0_0EXJavaScriptValue;

/**
 The property descriptor options for the property being defined or modified.
 */
typedef NS_OPTIONS(NSInteger, ABI45_0_0EXJavaScriptObjectPropertyDescriptor) {
  /**
   If set, the type of this property descriptor may be changed and if the property may be deleted from the corresponding object.
   */
  ABI45_0_0EXJavaScriptObjectPropertyDescriptorConfigurable = 1 << 0,
  /**
   If set, the property shows up during enumeration of the properties on the corresponding object.
   */
  ABI45_0_0EXJavaScriptObjectPropertyDescriptorEnumerable = 1 << 1,
  /**
   If set, the value associated with the property may be changed with an assignment operator.
   */
  ABI45_0_0EXJavaScriptObjectPropertyDescriptorWritable = 1 << 2,
} NS_SWIFT_NAME(JavaScriptObjectPropertyDescriptor);

NS_SWIFT_NAME(JavaScriptObject)
@interface ABI45_0_0EXJavaScriptObject : NSObject

// Some parts of the interface must be hidden for Swift – it can't import any C++ code.
#ifdef __cplusplus
- (nonnull instancetype)initWith:(std::shared_ptr<jsi::Object>)jsObjectPtr
                         runtime:(nonnull ABI45_0_0EXJavaScriptRuntime *)runtime;

/**
 Returns the pointer to the underlying object.
 */
- (nonnull jsi::Object *)get;
#endif // __cplusplus

#pragma mark - Accessing object properties

/**
 \return a bool whether the object has a property with the given name.
 */
- (BOOL)hasProperty:(nonnull NSString *)name;

/**
 \return the property of the object with the given name.
 If the name isn't a property on the object, returns the `undefined` value.
 */
- (nonnull ABI45_0_0EXJavaScriptValue *)getProperty:(nonnull NSString *)name;

/**
 \return an array consisting of all enumerable property names in the object and its prototype chain.
 */
- (nonnull NSArray<NSString *> *)getPropertyNames;

#pragma mark - Modifying object properties

/**
 Sets the value for the property with the given name.
 */
- (void)setProperty:(nonnull NSString *)name value:(nullable id)value;

/**
 Defines a new property or modifies an existing property on the object. Calls `Object.defineProperty` under the hood.
 */
- (void)defineProperty:(nonnull NSString *)name value:(nullable id)value options:(ABI45_0_0EXJavaScriptObjectPropertyDescriptor)options;

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
