// Copyright 2025-present 650 Industries. All rights reserved.

#import <ExpoModulesWorklets/EXJavaScriptSerializable.h>
#import <ExpoModulesWorklets/SerializableExtractor.h>
#import <ExpoModulesJSI/EXJavaScriptValue.h>
#import <ExpoModulesJSI/EXJavaScriptRuntime.h>

#if WORKLETS_ENABLED

#import "EXJavaScriptSerializable+Private.h"
#import <worklets/SharedItems/Serializable.h>

@implementation EXSerializableExtractor

+ (BOOL)isSerializable:(nonnull EXJavaScriptValue *)value
               runtime:(nonnull EXJavaScriptRuntime *)runtime
{
  jsi::Value jsValue = [value get];
  jsi::Runtime *rt = [runtime get];

  if (!jsValue.isObject()) {
    return NO;
  }

  jsi::Object obj = jsValue.getObject(*rt);

  return obj.hasProperty(*rt, "__serializableRef") && obj.hasNativeState(*rt);
}

+ (nullable EXJavaScriptSerializable *)extractSerializable:(nonnull EXJavaScriptValue *)value
                                                   runtime:(nonnull EXJavaScriptRuntime *)runtime
{
  if (![self isSerializable:value runtime:runtime]) {
    return nil;
  }

  jsi::Value jsValue = [value get];
  jsi::Runtime *rt = [runtime get];
  jsi::Object obj = jsValue.getObject(*rt);

  auto serializable = worklets::extractSerializableOrThrow(*rt, jsValue);

  return [[EXJavaScriptSerializable alloc] initWithSerializable:serializable runtime:runtime];
}

@end

#else

@implementation EXSerializableExtractor

+ (BOOL)isSerializable:(nonnull EXJavaScriptValue *)value runtime:(nonnull EXJavaScriptRuntime *)runtime
{
  return NO;
}

+ (nullable EXJavaScriptSerializable *)extractSerializable:(nonnull EXJavaScriptValue *)value
                                                   runtime:(nonnull EXJavaScriptRuntime *)runtime
{
  return nil;
}

@end

#endif
