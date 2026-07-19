// Copyright 2025-present 650 Industries. All rights reserved.

#import <ExpoModulesWorklets/WorkletRuntimeHandle.h>
#import <ExpoModulesWorklets/EXJavaScriptSerializable.h>
#import <ExpoModulesWorklets/EXWorkletsProvider.h>

@implementation EXWorkletRuntimeHandle {
  // Opaque handle from the provider; only the adapter knows it wraps a
  // `weak_ptr<worklets::WorkletRuntime>`.
  id _runtimeHandle;
  id<EXWorkletsProvider> _provider;
}

- (nullable instancetype)initWithRawPointer:(void *)pointer
{
  id<EXWorkletsProvider> provider = EXWorkletsProviderRegistry.shared;
  if (!provider) {
    NSLog(@"[ExpoModulesWorklets] Warning: Cannot create WorkletRuntimeHandle; the worklets provider is not registered (is `react-native-worklets` installed?)");
    return nil;
  }
  id handle = [provider workletRuntimeHandleForRawPointer:pointer];
  if (!handle) {
    return nil;
  }
  if (self = [super init]) {
    _runtimeHandle = handle;
    _provider = provider;
  }
  return self;
}

- (void)scheduleWorklet:(EXJavaScriptSerializable *)serializable
              arguments:(NSArray *)arguments
{
  [_provider scheduleWorkletWithRuntimeHandle:_runtimeHandle
                                 serializable:serializable
                                    arguments:arguments];
}

- (void)executeWorklet:(EXJavaScriptSerializable *)serializable
             arguments:(NSArray *)arguments
{
  [_provider executeWorkletWithRuntimeHandle:_runtimeHandle
                                serializable:serializable
                                   arguments:arguments];
}

@end
