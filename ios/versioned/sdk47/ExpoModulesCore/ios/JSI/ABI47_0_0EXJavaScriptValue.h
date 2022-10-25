// Copyright 2022-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXJavaScriptObject.h>

#ifdef __cplusplus
#import <ABI47_0_0jsi/ABI47_0_0jsi.h>
namespace jsi = ABI47_0_0facebook::jsi;
#endif // __cplusplus

@class ABI47_0_0EXJavaScriptRuntime;
@class ABI47_0_0EXJavaScriptTypedArray;

/**
 Represents any JavaScript value. Its purpose is to exposes `ABI47_0_0facebook::jsi::Value` API back to Swift.
 */
NS_SWIFT_NAME(JavaScriptValue)
@interface ABI47_0_0EXJavaScriptValue : NSObject

#ifdef __cplusplus
- (nonnull instancetype)initWithRuntime:(nonnull ABI47_0_0EXJavaScriptRuntime *)runtime
                                  value:(std::shared_ptr<jsi::Value>)value;

/**
 \return the underlying `jsi::Value`.
 */
- (nonnull jsi::Value *)get;
#endif // __cplusplus

#pragma mark - Type checking

- (BOOL)isUndefined;
- (BOOL)isNull;
- (BOOL)isBool;
- (BOOL)isNumber;
- (BOOL)isString;
- (BOOL)isSymbol;
- (BOOL)isObject;
- (BOOL)isFunction;
- (BOOL)isTypedArray;

#pragma mark - Type casting

- (nullable id)getRaw;
- (BOOL)getBool;
- (NSInteger)getInt;
- (double)getDouble;
- (nonnull NSString *)getString;
- (nonnull NSArray<ABI47_0_0EXJavaScriptValue *> *)getArray;
- (nonnull NSDictionary<NSString *, id> *)getDictionary;
- (nonnull ABI47_0_0EXJavaScriptObject *)getObject;
- (nullable ABI47_0_0EXJavaScriptTypedArray *)getTypedArray;

#pragma mark - Helpers

- (nonnull NSString *)toString;

@end
