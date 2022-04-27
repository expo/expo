// Copyright 2022-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ExpoModulesCore/EXJavaScriptObject.h>

#ifdef __cplusplus
#import <jsi/jsi.h>
namespace jsi = facebook::jsi;
#endif // __cplusplus

@class EXJavaScriptRuntime;

/**
 Represents any JavaScript value. Its purpose is to exposes `facebook::jsi::Value` API back to Swift.
 */
NS_SWIFT_NAME(JavaScriptValue)
@interface EXJavaScriptValue : NSObject

#ifdef __cplusplus
- (nonnull instancetype)initWithRuntime:(nonnull EXJavaScriptRuntime *)runtime
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

+ (nonnull NSString *)kindOf:(nonnull EXJavaScriptValue *)value;

#pragma mark - Type casting

- (nullable id)getRaw;
- (BOOL)getBool;
- (NSInteger)getInt;
- (double)getDouble;
- (nonnull NSString *)getString;
- (nonnull NSArray<EXJavaScriptValue *> *)getArray;
- (nonnull NSDictionary<NSString *, id> *)getDictionary;
- (nonnull EXJavaScriptObject *)getObject;

#pragma mark - Helpers

- (nonnull NSString *)toString;

@end
