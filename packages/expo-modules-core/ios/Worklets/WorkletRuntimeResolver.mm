// Copyright 2025-present 650 Industries. All rights reserved.

#import <ExpoModulesWorklets/WorkletRuntimeResolver.h>
#import <ExpoModulesWorklets/EXWorkletsProvider.h>

@implementation EXWorkletRuntimeResolver

+ (void * _Nullable)uiRuntimePointerWithRuntimePointer:(void *)runtimePointer
                                         holderPointer:(const void *)holderPointer
{
  id<EXWorkletsProvider> provider = EXWorkletsProviderRegistry.shared;
  return [provider uiRuntimePointerWithRuntimePointer:runtimePointer holderPointer:holderPointer];
}

@end
