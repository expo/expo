/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <unordered_map>

#include <ABI41_0_0React/mounting/ShadowViewMutation.h>
#include <ABI41_0_0React/mounting/StubView.h>

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

class StubViewTree {
 public:
  StubViewTree() = default;
  StubViewTree(ShadowView const &shadowView);

  void mutate(ShadowViewMutationList const &mutations);

  StubView const &getRootStubView() const;

  Tag rootTag;
  std::unordered_map<Tag, StubView::Shared> registry{};
};

bool operator==(StubViewTree const &lhs, StubViewTree const &rhs);
bool operator!=(StubViewTree const &lhs, StubViewTree const &rhs);

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook
