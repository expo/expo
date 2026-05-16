// Copyright 2025-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ExpoModulesWorklets/EXWorkletsProvider.h>

NS_ASSUME_NONNULL_BEGIN

// Concrete provider in the source-only `ExpoModulesWorkletsAdapter` pod —
// holds every `worklets::*` reference and registers itself with
// `EXWorkletsProviderRegistry` when this optional pod is linked.
@interface ExpoWorkletsBridgeProvider : NSObject <EXWorkletsProvider>

@end

NS_ASSUME_NONNULL_END
