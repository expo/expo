/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// NOTE: This entire file should be codegen'ed.

#pragma once

#include <ABI47_0_0ReactCommon/ABI47_0_0JavaTurboModule.h>
#include <ABI47_0_0ReactCommon/ABI47_0_0TurboModule.h>
#include <fbjni/fbjni.h>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

/**
 * C++ class for module 'SampleTurboModule'
 */
class JSI_EXPORT NativeSampleTurboModuleSpecJSI : public JavaTurboModule {
 public:
  NativeSampleTurboModuleSpecJSI(const JavaTurboModule::InitParams &params);
};

std::shared_ptr<TurboModule> SampleTurboModuleSpec_ModuleProvider(
    const std::string &moduleName,
    const JavaTurboModule::InitParams &params);

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
