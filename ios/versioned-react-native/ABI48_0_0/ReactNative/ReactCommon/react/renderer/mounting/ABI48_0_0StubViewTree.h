/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <unordered_map>

#include <ABI48_0_0React/ABI48_0_0renderer/mounting/ShadowViewMutation.h>
#include <ABI48_0_0React/ABI48_0_0renderer/mounting/StubView.h>

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

class StubViewTree {
 public:
  StubViewTree() = default;
  StubViewTree(ShadowView const &shadowView);

  void mutate(ShadowViewMutationList const &mutations);

  StubView const &getRootStubView() const;

  /*
   * Returns a view with given tag.
   */
  StubView const &getStubView(Tag tag) const;

  /*
   * Returns the total amount of views in the tree.
   */
  size_t size() const;

 private:
  Tag rootTag;
  std::unordered_map<Tag, StubView::Shared> registry{};

  friend bool operator==(StubViewTree const &lhs, StubViewTree const &rhs);
  friend bool operator!=(StubViewTree const &lhs, StubViewTree const &rhs);
};

bool operator==(StubViewTree const &lhs, StubViewTree const &rhs);
bool operator!=(StubViewTree const &lhs, StubViewTree const &rhs);

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook
