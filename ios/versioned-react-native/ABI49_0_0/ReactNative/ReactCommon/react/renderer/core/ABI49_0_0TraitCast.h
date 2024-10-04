/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <glog/logging.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0ShadowNode.h>
#include <memory>

namespace ABI49_0_0facebook::ABI49_0_0React::details {
template <typename ShadowNodePointerT, typename ParamT>
ShadowNodePointerT traitCastPointer(ParamT shadowNode) {
  auto expectedIdentifier =
      std::remove_pointer_t<ShadowNodePointerT>::IdentifierTrait();
  if (!shadowNode || !shadowNode->getTraits().check(expectedIdentifier)) {
    return nullptr;
  }

  return static_cast<ShadowNodePointerT>(shadowNode);
}

template <typename ShadowNodeRefT, typename ParamT>
ShadowNodeRefT traitCastRef(ParamT &&shadowNode) {
  auto expectedIdentifier =
      std::remove_reference_t<ShadowNodeRefT>::IdentifierTrait();
  if (!shadowNode.getTraits().check(expectedIdentifier)) {
    LOG(FATAL) << "Invalid ShadowNode cast\n"
               << "Expected identifier: " << std::hex
               << static_cast<int32_t>(expectedIdentifier) << "\n"
               << "Actual traits: " << std::hex
               << static_cast<int32_t>(shadowNode.getTraits().get()) << "\n";
  }

  return static_cast<ShadowNodeRefT>(shadowNode);
}

template <typename ShadowNodeT, typename ParamT>
std::shared_ptr<ShadowNodeT> traitCastShared(
    const std::shared_ptr<ParamT> &shadowNode) {
  auto expectedIdentifier = ShadowNodeT::IdentifierTrait();
  if (!shadowNode || !shadowNode->getTraits().check(expectedIdentifier)) {
    return nullptr;
  }

  return std::static_pointer_cast<ShadowNodeT>(shadowNode);
}
} // namespace ABI49_0_0facebook::ABI49_0_0React::details

namespace ABI49_0_0facebook::ABI49_0_0React {

// Cast from one ShadowNode reference to another, terminating if the cast is
// invalid.
template <typename ShadowNodeReferenceT>
ShadowNodeReferenceT traitCast(ShadowNode const &shadowNode) {
  return details::traitCastRef<ShadowNodeReferenceT>(shadowNode);
}
template <typename ShadowNodeReferenceT>
ShadowNodeReferenceT traitCast(ShadowNode &shadowNode) {
  return details::traitCastRef<ShadowNodeReferenceT>(shadowNode);
}

// Cast from one ShadowNode pointer to another, returning nullptr if the cast is
// invalid.
template <typename ShadowNodePointerT>
ShadowNodePointerT traitCast(ShadowNode const *shadowNode) {
  return details::traitCastPointer<ShadowNodePointerT>(shadowNode);
}
template <typename ShadowNodePointerT>
ShadowNodePointerT traitCast(ShadowNode *shadowNode) {
  return details::traitCastPointer<ShadowNodePointerT>(shadowNode);
}

// Cast from one ShadowNode shared_ptr to another, returning nullptr if the
// cast is invalid.
template <typename ShadowNodeT, typename ParamT>
std::shared_ptr<ShadowNodeT> traitCast(
    const std::shared_ptr<ParamT> &shadowNode) {
  return details::traitCastShared<ShadowNodeT>(shadowNode);
}
template <typename ShadowNodeT, typename ParamT>
std::shared_ptr<ShadowNodeT const> traitCast(
    const std::shared_ptr<ParamT const> &shadowNode) {
  return details::traitCastShared<ShadowNodeT const>(shadowNode);
}

} // namespace ABI49_0_0facebook::ABI49_0_0React
