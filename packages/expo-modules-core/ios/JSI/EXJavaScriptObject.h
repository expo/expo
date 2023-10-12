// Copyright 2022-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#ifdef __cplusplus
#import <jsi/jsi.h>

namespace jsi = facebook::jsi;
#endif // __cplusplus

@class EXJavaScriptRuntime;
@class EXJavaScriptValue;
@class EXJavaScriptWeakObject;

/**
 The property descriptor options for the property being defined or modified.
 */
typedef NS_OPTIONS(NSInteger, EXJavaScriptObjectPropertyDescriptor) {
  /**
   If set, the type of this property descriptor may be changed and if the property may be deleted from the corresponding object.
   */
  EXJavaScriptObjectPropertyDescriptorConfigurable = 1 << 0,
  /**
   If set, the property shows up during enumeration of the properties on the corresponding object.
   */
  EXJavaScriptObjectPropertyDescriptorEnumerable = 1 << 1,
  /**
   If set, the value associated with the property may be changed with an assignment operator.
   */
  EXJavaScriptObjectPropertyDescriptorWritable = 1 << 2,
} NS_SWIFT_NAME(JavaScriptObjectPropertyDescriptor);

NS_SWIFT_NAME(JavaScriptObject)
@interface EXJavaScriptObject : NSObject

// Some parts of the interface must be hidden for Swift – it can't import any C++ code.
#ifdef __cplusplus
- (nonnull instancetype)initWith:(std::shared_ptr<jsi::Object>)jsObjectPtr
                         runtime:(nonnull EXJavaScriptRuntime *)runtime;

/**
 Returns the pointer to the underlying object.
 */
- (nonnull jsi::Object *)get;

/**
 Returns the shared pointer to the underlying object.
 */
- (std::shared_ptr<jsi::Object>)getShared;
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
- (nonnull EXJavaScriptValue *)getProperty:(nonnull NSString *)name;

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
 Defines a new property or modifies an existing property on the object using the property descriptor.
 */
- (void)defineProperty:(nonnull NSString *)name descriptor:(nonnull EXJavaScriptObject *)descriptor;

/**
 Defines a new property or modifies an existing property on the object. Calls `Object.defineProperty` under the hood.
 */
- (void)defineProperty:(nonnull NSString *)name value:(nullable id)value options:(EXJavaScriptObjectPropertyDescriptor)options;

#pragma mark - WeakObject

- (nonnull EXJavaScriptWeakObject *)createWeak;

#pragma mark - Deallocator

- (void)setObjectDeallocator:(void (^ _Nonnull)(void))deallocatorBlock;

@end
