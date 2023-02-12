/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifdef __cplusplus

#include "ABI48_0_0Yoga-internal.h"
#include "ABI48_0_0Yoga.h"

struct YOGA_EXPORT ABI48_0_0YGConfig {
  using LogWithContextFn = int (*)(
      ABI48_0_0YGConfigRef config,
      ABI48_0_0YGNodeRef node,
      ABI48_0_0YGLogLevel level,
      void* context,
      const char* format,
      va_list args);
  using CloneWithContextFn = ABI48_0_0YGNodeRef (*)(
      ABI48_0_0YGNodeRef node,
      ABI48_0_0YGNodeRef owner,
      int childIndex,
      void* cloneContext);

private:
  union {
    CloneWithContextFn withContext;
    ABI48_0_0YGCloneNodeFunc noContext;
  } cloneNodeCallback_;
  union {
    LogWithContextFn withContext;
    ABI48_0_0YGLogger noContext;
  } logger_;
  bool cloneNodeUsesContext_;
  bool loggerUsesContext_;

public:
  bool useWebDefaults = false;
  bool useLegacyStretchBehaviour = false;
  bool shouldDiffLayoutWithoutLegacyStretchBehaviour = false;
  bool printTree = false;
  float pointScaleFactor = 1.0f;
  std::array<bool, ABI48_0_0facebook::yoga::enums::count<ABI48_0_0YGExperimentalFeature>()>
      experimentalFeatures = {};
  void* context = nullptr;

  ABI48_0_0YGConfig(ABI48_0_0YGLogger logger);
  void log(ABI48_0_0YGConfig*, ABI48_0_0YGNode*, ABI48_0_0YGLogLevel, void*, const char*, va_list);
  void setLogger(ABI48_0_0YGLogger logger) {
    logger_.noContext = logger;
    loggerUsesContext_ = false;
  }
  void setLogger(LogWithContextFn logger) {
    logger_.withContext = logger;
    loggerUsesContext_ = true;
  }
  void setLogger(std::nullptr_t) { setLogger(ABI48_0_0YGLogger{nullptr}); }

  ABI48_0_0YGNodeRef cloneNode(
      ABI48_0_0YGNodeRef node,
      ABI48_0_0YGNodeRef owner,
      int childIndex,
      void* cloneContext);
  void setCloneNodeCallback(ABI48_0_0YGCloneNodeFunc cloneNode) {
    cloneNodeCallback_.noContext = cloneNode;
    cloneNodeUsesContext_ = false;
  }
  void setCloneNodeCallback(CloneWithContextFn cloneNode) {
    cloneNodeCallback_.withContext = cloneNode;
    cloneNodeUsesContext_ = true;
  }
  void setCloneNodeCallback(std::nullptr_t) {
    setCloneNodeCallback(ABI48_0_0YGCloneNodeFunc{nullptr});
  }
};

#endif
