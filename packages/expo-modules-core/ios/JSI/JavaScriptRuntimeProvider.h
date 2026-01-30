#pragma once

#ifdef __cplusplus
#import "jsi.h"
#endif

@protocol JavaScriptRuntimeProvider

#ifdef __cplusplus
- (nonnull instancetype)init:(facebook::jsi::Runtime &)runtime;
- (nonnull facebook::jsi::Runtime *)consume;
#endif

@end
