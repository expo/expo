/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once
#include "ABI32_0_0Yoga-internal.h"
#include "ABI32_0_0Yoga.h"

struct ABI32_0_0YGConfig {
  std::array<bool, ABI32_0_0YGExperimentalFeatureCount> experimentalFeatures;
  bool useWebDefaults;
  bool useLegacyStretchBehaviour;
  bool shouldDiffLayoutWithoutLegacyStretchBehaviour;
  float pointScaleFactor;
  ABI32_0_0YGLogger logger;
  ABI32_0_0YGCloneNodeFunc cloneNodeCallback;
  void* context;

  ABI32_0_0YGConfig(ABI32_0_0YGLogger logger);
};
