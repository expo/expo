/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include "ABI37_0_0YGConfig.h"

ABI37_0_0YGConfig::ABI37_0_0YGConfig(ABI37_0_0YGLogger logger) : cloneNodeCallback_{nullptr} {
  logger_.noContext = logger;
  loggerUsesContext_ = false;
}

void ABI37_0_0YGConfig::log(
    ABI37_0_0YGConfig* config,
    ABI37_0_0YGNode* node,
    ABI37_0_0YGLogLevel logLevel,
    void* logContext,
    const char* format,
    va_list args) {
  if (loggerUsesContext_) {
    logger_.withContext(config, node, logLevel, logContext, format, args);
  } else {
    logger_.noContext(config, node, logLevel, format, args);
  }
}

ABI37_0_0YGNodeRef ABI37_0_0YGConfig::cloneNode(
    ABI37_0_0YGNodeRef node,
    ABI37_0_0YGNodeRef owner,
    int childIndex,
    void* cloneContext) {
  ABI37_0_0YGNodeRef clone = nullptr;
  if (cloneNodeCallback_.noContext != nullptr) {
    clone = cloneNodeUsesContext_
        ? cloneNodeCallback_.withContext(node, owner, childIndex, cloneContext)
        : cloneNodeCallback_.noContext(node, owner, childIndex);
  }
  if (clone == nullptr) {
    clone = ABI37_0_0YGNodeClone(node);
  }
  return clone;
}
