/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI31_0_0YGConfig.h"

const std::array<bool, ABI31_0_0YGExperimentalFeatureCount>
    kABI31_0_0YGDefaultExperimentalFeatures = {{false}};

ABI31_0_0YGConfig::ABI31_0_0YGConfig(ABI31_0_0YGLogger logger)
    : experimentalFeatures(kABI31_0_0YGDefaultExperimentalFeatures),
      useWebDefaults(false),
      useLegacyStretchBehaviour(false),
      shouldDiffLayoutWithoutLegacyStretchBehaviour(false),
      pointScaleFactor(1.0f), logger(logger), cloneNodeCallback(nullptr),
      context(nullptr) {}
