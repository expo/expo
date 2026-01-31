#pragma once

#import <Foundation/Foundation.h>

#ifdef __cplusplus
#include <jsi/jsi.h>
#endif

@interface JavaScriptRuntimeProvider : NSObject

#ifdef __cplusplus
- (nonnull instancetype)init:(facebook::jsi::Runtime &)runtime;
- (nonnull facebook::jsi::Runtime *)consume;
#endif

@end
