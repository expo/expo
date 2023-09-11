/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifdef __cplusplus

#include "ABI47_0_0Yoga-internal.h"
#include "ABI47_0_0Yoga.h"

struct YOGA_EXPORT ABI47_0_0YGConfig {
  using LogWithContextFn = int (*)(
      ABI47_0_0YGConfigRef config,
      ABI47_0_0YGNodeRef node,
      ABI47_0_0YGLogLevel level,
      void* context,
      const char* format,
      va_list args);
  using CloneWithContextFn = ABI47_0_0YGNodeRef (*)(
      ABI47_0_0YGNodeRef node,
      ABI47_0_0YGNodeRef owner,
      int childIndex,
      void* cloneContext);

private:
  union {
    CloneWithContextFn withContext;
    ABI47_0_0YGCloneNodeFunc noContext;
  } cloneNodeCallback_;
  union {
    LogWithContextFn withContext;
    ABI47_0_0YGLogger noContext;
  } logger_;
  bool cloneNodeUsesContext_;
  bool loggerUsesContext_;

public:
  bool useWebDefaults = false;
  bool useLegacyStretchBehaviour = false;
  bool shouldDiffLayoutWithoutLegacyStretchBehaviour = false;
  bool printTree = false;
  float pointScaleFactor = 1.0f;
  std::array<bool, ABI47_0_0facebook::yoga::enums::count<ABI47_0_0YGExperimentalFeature>()>
      experimentalFeatures = {};
  void* context = nullptr;

  ABI47_0_0YGConfig(ABI47_0_0YGLogger logger);
  void log(ABI47_0_0YGConfig*, ABI47_0_0YGNode*, ABI47_0_0YGLogLevel, void*, const char*, va_list);
  void setLogger(ABI47_0_0YGLogger logger) {
    logger_.noContext = logger;
    loggerUsesContext_ = false;
  }
  void setLogger(LogWithContextFn logger) {
    logger_.withContext = logger;
    loggerUsesContext_ = true;
  }
  void setLogger(std::nullptr_t) { setLogger(ABI47_0_0YGLogger{nullptr}); }

  ABI47_0_0YGNodeRef cloneNode(
      ABI47_0_0YGNodeRef node,
      ABI47_0_0YGNodeRef owner,
      int childIndex,
      void* cloneContext);
  void setCloneNodeCallback(ABI47_0_0YGCloneNodeFunc cloneNode) {
    cloneNodeCallback_.noContext = cloneNode;
    cloneNodeUsesContext_ = false;
  }
  void setCloneNodeCallback(CloneWithContextFn cloneNode) {
    cloneNodeCallback_.withContext = cloneNode;
    cloneNodeUsesContext_ = true;
  }
  void setCloneNodeCallback(std::nullptr_t) {
    setCloneNodeCallback(ABI47_0_0YGCloneNodeFunc{nullptr});
  }
};

#endif
