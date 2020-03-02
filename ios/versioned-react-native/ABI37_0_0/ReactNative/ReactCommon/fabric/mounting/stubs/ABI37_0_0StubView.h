// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <memory>
#include <vector>

#include <ABI37_0_0React/core/LayoutMetrics.h>
#include <ABI37_0_0React/core/State.h>
#include <ABI37_0_0React/mounting/ShadowView.h>

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

class StubView final {
 public:
  using Shared = std::shared_ptr<StubView>;

  StubView() = default;
  StubView(StubView const &stubView) = default;

  void update(ShadowView const &shadowView);

  ComponentName componentName;
  ComponentHandle componentHandle;
  Tag tag;
  SharedProps props;
  SharedEventEmitter eventEmitter;
  LayoutMetrics layoutMetrics;
  State::Shared state;
  std::vector<StubView::Shared> children;
};

bool operator==(StubView const &lhs, StubView const &rhs);
bool operator!=(StubView const &lhs, StubView const &rhs);

#if ABI37_0_0RN_DEBUG_STRING_CONVERTIBLE

std::string getDebugName(StubView const &stubView);
std::vector<DebugStringConvertibleObject> getDebugProps(
    StubView const &stubView,
    DebugStringConvertibleOptions options = {});
std::vector<StubView> getDebugChildren(
    StubView const &stubView,
    DebugStringConvertibleOptions options = {});

#endif

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
