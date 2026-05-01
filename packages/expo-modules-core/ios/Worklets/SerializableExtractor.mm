// Copyright 2025-present 650 Industries. All rights reserved.

#import <ExpoModulesWorklets/EXJavaScriptSerializable.h>
#import <ExpoModulesWorklets/SerializableExtractor.h>

#if WORKLETS_ENABLED

#import "EXJavaScriptSerializable+Private.h"
#import <worklets/SharedItems/Serializable.h>

@implementation EXSerializableExtractor

+ (BOOL)isSerializableWithRuntimePointer:(void *)runtimePointer
                            valuePointer:(const void *)valuePointer
{
  jsi::Runtime &rt = *reinterpret_cast<jsi::Runtime *>(runtimePointer);
  const jsi::Value &value = *reinterpret_cast<const jsi::Value *>(valuePointer);

  if (!value.isObject()) {
    return NO;
  }

  jsi::Object obj = value.getObject(rt);

  return obj.hasProperty(rt, "__serializableRef") && obj.hasNativeState(rt);
}

+ (nullable EXJavaScriptSerializable *)extractSerializableWithRuntimePointer:(void *)runtimePointer
                                                                valuePointer:(const void *)valuePointer
{
  if (![self isSerializableWithRuntimePointer:runtimePointer valuePointer:valuePointer]) {
    return nil;
  }

  jsi::Runtime &rt = *reinterpret_cast<jsi::Runtime *>(runtimePointer);
  const jsi::Value &value = *reinterpret_cast<const jsi::Value *>(valuePointer);

  auto serializable = worklets::extractSerializableOrThrow(rt, value);

  return [[EXJavaScriptSerializable alloc] initWithSerializable:serializable];
}

@end

#else

@implementation EXSerializableExtractor

+ (BOOL)isSerializableWithRuntimePointer:(void *)runtimePointer
                            valuePointer:(const void *)valuePointer
{
  return NO;
}

+ (nullable EXJavaScriptSerializable *)extractSerializableWithRuntimePointer:(void *)runtimePointer
                                                                valuePointer:(const void *)valuePointer
{
  return nil;
}

@end

#endif
