// Copyright 2025-present 650 Industries. All rights reserved.

#import <ExpoModulesWorklets/EXWorkletsProvider.h>

NS_ASSUME_NONNULL_BEGIN

// Setter for the shared provider — intended to be called exactly once from
// `ExpoWorkletsBridgeProvider`'s `+load` in the adapter pod. Kept out of the
// public umbrella header to discourage callers from clobbering the provider
// after registration.
@interface EXWorkletsProviderRegistry (Private)

+ (void)setShared:(nullable id<EXWorkletsProvider>)shared;

@end

NS_ASSUME_NONNULL_END
