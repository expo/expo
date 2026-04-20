// Copyright 2025-present 650 Industries. All rights reserved.

#import <ExpoModulesWorklets/EXJavaScriptSerializable.h>

#ifdef __cplusplus
#if WORKLETS_ENABLED

#include <worklets/SharedItems/Serializable.h>

@interface EXJavaScriptSerializable ()

- (nonnull instancetype)initWithSerializable:(std::shared_ptr<worklets::Serializable>)serializable
                                     runtime:(nonnull EXJavaScriptRuntime *)runtime;

- (std::shared_ptr<worklets::Serializable>)getSerializable;

@end

#endif
#endif
