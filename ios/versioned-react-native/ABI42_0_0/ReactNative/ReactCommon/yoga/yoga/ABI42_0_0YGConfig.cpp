/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI42_0_0YGConfig.h"

ABI42_0_0YGConfig::ABI42_0_0YGConfig(ABI42_0_0YGLogger logger) : cloneNodeCallback_{nullptr} {
  logger_.noContext = logger;
  loggerUsesContext_ = false;
}

void ABI42_0_0YGConfig::log(
    ABI42_0_0YGConfig* config,
    ABI42_0_0YGNode* node,
    ABI42_0_0YGLogLevel logLevel,
    void* logContext,
    const char* format,
    va_list args) {
  if (loggerUsesContext_) {
    logger_.withContext(config, node, logLevel, logContext, format, args);
  } else {
    logger_.noContext(config, node, logLevel, format, args);
  }
}

ABI42_0_0YGNodeRef ABI42_0_0YGConfig::cloneNode(
    ABI42_0_0YGNodeRef node,
    ABI42_0_0YGNodeRef owner,
    int childIndex,
    void* cloneContext) {
  ABI42_0_0YGNodeRef clone = nullptr;
  if (cloneNodeCallback_.noContext != nullptr) {
    clone = cloneNodeUsesContext_
        ? cloneNodeCallback_.withContext(node, owner, childIndex, cloneContext)
        : cloneNodeCallback_.noContext(node, owner, childIndex);
  }
  if (clone == nullptr) {
    clone = ABI42_0_0YGNodeClone(node);
  }
  return clone;
}
