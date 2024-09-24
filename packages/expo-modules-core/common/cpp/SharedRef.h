// Copyright 2024-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include "SharedObject.h"

#include <jsi/jsi.h>

namespace jsi = facebook::jsi;

namespace expo::SharedRef {

/**
 Installs a base JavaScript class for all shared references.
 */
void installBaseClass(jsi::Runtime &runtime);

/**
 Returns the base JavaScript class for all shared refs, i.e. `global.expo.SharedRef`.
 */
jsi::Function getBaseClass(jsi::Runtime &runtime);

/**
 Creates a concrete shared ref class with the given name and constructor.
 */
jsi::Function createClass(jsi::Runtime &runtime, const char *className, common::ClassConstructor constructor);

} // namespace expo::SharedRef

#endif // __cplusplus
