/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once
#include "ABI35_0_0YGMarker.h"
#include "ABI35_0_0Yoga-internal.h"
#include "ABI35_0_0Yoga.h"

struct ABI35_0_0YGConfig {
  std::array<bool, facebook::ABI35_0_0yoga::enums::count<ABI35_0_0YGExperimentalFeature>()>
      experimentalFeatures = {};
  bool useWebDefaults = false;
  bool useLegacyStretchBehaviour = false;
  bool shouldDiffLayoutWithoutLegacyStretchBehaviour = false;
  bool printTree = false;
  float pointScaleFactor = 1.0f;
  ABI35_0_0YGLogger logger;
  ABI35_0_0YGCloneNodeFunc cloneNodeCallback = nullptr;
  void* context = nullptr;
  ABI35_0_0YGMarkerCallbacks markerCallbacks = {nullptr, nullptr};

  ABI35_0_0YGConfig(ABI35_0_0YGLogger logger);
};
