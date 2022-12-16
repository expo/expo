// Copyright 2022-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXJavaScriptValue.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXJavaScriptRuntime.h>

#ifdef __cplusplus
#import <ABI46_0_0jsi/ABI46_0_0jsi.h>

namespace jsi = ABI46_0_0facebook::jsi;
#endif // __cplusplus

NS_SWIFT_NAME(JavaScriptWeakObject)
@interface ABI46_0_0EXJavaScriptWeakObject : NSObject

#ifdef __cplusplus
- (nonnull instancetype)initWith:(std::shared_ptr<jsi::Object>)jsObject
                         runtime:(nonnull ABI46_0_0EXJavaScriptRuntime *)runtime;
#endif // __cplusplus

- (nullable ABI46_0_0EXJavaScriptObject *)lock;

@end
