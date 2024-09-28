// Copyright 2022-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ExpoModulesCore/EXJavaScriptObject.h>

#ifdef __cplusplus
#import <jsi/jsi.h>
namespace jsi = facebook::jsi;
#endif // __cplusplus

@class EXJavaScriptRuntime;
@class EXRawJavaScriptFunction;
@class EXJavaScriptTypedArray;

/**
 Represents any JavaScript value. Its purpose is to exposes `facebook::jsi::Value` API back to Swift.
 */
NS_SWIFT_NAME(JavaScriptValue)
@interface EXJavaScriptValue : NSObject

#ifdef __cplusplus
- (nonnull instancetype)initWithRuntime:(nullable EXJavaScriptRuntime *)runtime
                                  value:(jsi::Value)value;

/**
 Returns a copy of the underlying `jsi::Value`.
 */
- (jsi::Value)get;
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
- (nonnull NSArray<EXJavaScriptValue *> *)getArray;
- (nonnull NSDictionary<NSString *, id> *)getDictionary;
- (nonnull EXJavaScriptObject *)getObject;
- (nonnull EXRawJavaScriptFunction *)getFunction;
- (nullable EXJavaScriptTypedArray *)getTypedArray;

#pragma mark - Helpers

- (nonnull NSString *)toString;

#pragma mark - Statics

@property (class, nonatomic, assign, readonly, nonnull) EXJavaScriptValue *undefined;

+ (nonnull EXJavaScriptValue *)number:(double)value;

+ (nonnull EXJavaScriptValue *)string:(nonnull NSString *)value runtime:(nonnull EXJavaScriptRuntime *)runtime;

+ (nonnull EXJavaScriptValue *)from:(nullable id)value runtime:(nonnull EXJavaScriptRuntime *)runtime;

@end
