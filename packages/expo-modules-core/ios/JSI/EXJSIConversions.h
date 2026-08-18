// Copyright 2018-present 650 Industries. All rights reserved.

#pragma once
#ifdef __cplusplus

#import <Foundation/Foundation.h>
#include <jsi/jsi.h>

namespace jsi = facebook::jsi;

namespace expo {

jsi::Value convertObjCObjectToJSIValue(jsi::Runtime &runtime, id value);

} // namespace expo

#endif // __cplusplus
