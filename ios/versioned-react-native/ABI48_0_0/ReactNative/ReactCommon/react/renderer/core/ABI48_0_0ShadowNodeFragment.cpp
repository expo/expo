/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI48_0_0ShadowNodeFragment.h"

namespace ABI48_0_0facebook::ABI48_0_0React {

Props::Shared const &ShadowNodeFragment::propsPlaceholder() {
  static auto &instance = *new Props::Shared();
  return instance;
}

ShadowNode::SharedListOfShared const &
ShadowNodeFragment::childrenPlaceholder() {
  static auto &instance = *new ShadowNode::SharedListOfShared();
  return instance;
}

State::Shared const &ShadowNodeFragment::statePlaceholder() {
  static auto &instance = *new State::Shared();
  return instance;
}

using Value = ShadowNodeFragment::Value;

Value::Value(ShadowNodeFragment const &fragment)
    : props(fragment.props),
      children(fragment.children),
      state(fragment.state) {}

Value::operator ShadowNodeFragment() const {
  return ShadowNodeFragment{props, children, state};
}

} // namespace ABI48_0_0facebook::ABI48_0_0React
