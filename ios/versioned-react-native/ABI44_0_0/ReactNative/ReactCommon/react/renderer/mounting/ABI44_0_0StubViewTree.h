/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <unordered_map>

#include <ABI44_0_0React/ABI44_0_0renderer/mounting/ShadowViewMutation.h>
#include <ABI44_0_0React/ABI44_0_0renderer/mounting/StubView.h>

namespace ABI44_0_0facebook {
namespace ABI44_0_0React {

class StubViewTree {
 public:
  StubViewTree() = default;
  StubViewTree(ShadowView const &shadowView);

  void mutate(
      ShadowViewMutationList const &mutations,
      bool ignoreDuplicateCreates = false);

  StubView const &getRootStubView() const;

  Tag rootTag;
  std::unordered_map<Tag, StubView::Shared> registry{};
};

bool operator==(StubViewTree const &lhs, StubViewTree const &rhs);
bool operator!=(StubViewTree const &lhs, StubViewTree const &rhs);

} // namespace ABI44_0_0React
} // namespace ABI44_0_0facebook
