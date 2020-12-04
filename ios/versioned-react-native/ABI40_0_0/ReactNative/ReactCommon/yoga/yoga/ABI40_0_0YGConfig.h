/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once
#include "ABI40_0_0Yoga-internal.h"
#include "ABI40_0_0Yoga.h"

struct YOGA_EXPORT ABI40_0_0YGConfig {
  using LogWithContextFn = int (*)(
      ABI40_0_0YGConfigRef config,
      ABI40_0_0YGNodeRef node,
      ABI40_0_0YGLogLevel level,
      void* context,
      const char* format,
      va_list args);
  using CloneWithContextFn = ABI40_0_0YGNodeRef (*)(
      ABI40_0_0YGNodeRef node,
      ABI40_0_0YGNodeRef owner,
      int childIndex,
      void* cloneContext);

private:
  union {
    CloneWithContextFn withContext;
    ABI40_0_0YGCloneNodeFunc noContext;
  } cloneNodeCallback_;
  union {
    LogWithContextFn withContext;
    ABI40_0_0YGLogger noContext;
  } logger_;
  bool cloneNodeUsesContext_;
  bool loggerUsesContext_;

public:
  bool useWebDefaults = false;
  bool useLegacyStretchBehaviour = false;
  bool shouldDiffLayoutWithoutLegacyStretchBehaviour = false;
  bool printTree = false;
  float pointScaleFactor = 1.0f;
  std::array<bool, ABI40_0_0facebook::yoga::enums::count<ABI40_0_0YGExperimentalFeature>()>
      experimentalFeatures = {};
  void* context = nullptr;

  ABI40_0_0YGConfig(ABI40_0_0YGLogger logger);
  void log(ABI40_0_0YGConfig*, ABI40_0_0YGNode*, ABI40_0_0YGLogLevel, void*, const char*, va_list);
  void setLogger(ABI40_0_0YGLogger logger) {
    logger_.noContext = logger;
    loggerUsesContext_ = false;
  }
  void setLogger(LogWithContextFn logger) {
    logger_.withContext = logger;
    loggerUsesContext_ = true;
  }
  void setLogger(std::nullptr_t) { setLogger(ABI40_0_0YGLogger{nullptr}); }

  ABI40_0_0YGNodeRef cloneNode(
      ABI40_0_0YGNodeRef node,
      ABI40_0_0YGNodeRef owner,
      int childIndex,
      void* cloneContext);
  void setCloneNodeCallback(ABI40_0_0YGCloneNodeFunc cloneNode) {
    cloneNodeCallback_.noContext = cloneNode;
    cloneNodeUsesContext_ = false;
  }
  void setCloneNodeCallback(CloneWithContextFn cloneNode) {
    cloneNodeCallback_.withContext = cloneNode;
    cloneNodeUsesContext_ = true;
  }
  void setCloneNodeCallback(std::nullptr_t) {
    setCloneNodeCallback(ABI40_0_0YGCloneNodeFunc{nullptr});
  }
};
