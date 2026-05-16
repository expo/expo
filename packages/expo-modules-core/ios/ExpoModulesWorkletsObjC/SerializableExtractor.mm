// Copyright 2025-present 650 Industries. All rights reserved.

#import <ExpoModulesWorklets/EXJavaScriptSerializable.h>
#import <ExpoModulesWorklets/SerializableExtractor.h>
#import <ExpoModulesWorklets/EXWorkletsProvider.h>

@implementation EXSerializableExtractor

+ (BOOL)isSerializableWithRuntimePointer:(void *)runtimePointer
                            valuePointer:(const void *)valuePointer
{
  id<EXWorkletsProvider> provider = EXWorkletsProviderRegistry.shared;
  if (!provider) {
    return NO;
  }
  return [provider isSerializableWithRuntimePointer:runtimePointer
                                       valuePointer:valuePointer];
}

+ (nullable EXJavaScriptSerializable *)extractSerializableWithRuntimePointer:(void *)runtimePointer
                                                                valuePointer:(const void *)valuePointer
{
  id<EXWorkletsProvider> provider = EXWorkletsProviderRegistry.shared;
  if (!provider) {
    return nil;
  }
  return [provider extractSerializableWithRuntimePointer:runtimePointer
                                            valuePointer:valuePointer];
}

@end
