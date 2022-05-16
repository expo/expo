// Copyright 2022-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ExpoModulesCore/EXJavaScriptValue.h>
#import <ExpoModulesCore/EXJavaScriptRuntime.h>

#ifdef __cplusplus
#import <jsi/jsi.h>

namespace jsi = facebook::jsi;
#endif // __cplusplus

NS_SWIFT_NAME(JavaScriptWeakObject)
@interface EXJavaScriptWeakObject : NSObject

#ifdef __cplusplus
- (nonnull instancetype)initWith:(std::shared_ptr<jsi::Object>)jsObject
                         runtime:(nonnull EXJavaScriptRuntime *)runtime;
#endif // __cplusplus

- (nullable EXJavaScriptObject *)lock;

@end
