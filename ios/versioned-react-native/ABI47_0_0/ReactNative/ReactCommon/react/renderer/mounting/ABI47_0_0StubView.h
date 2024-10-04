/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <vector>

#include <ABI47_0_0React/ABI47_0_0renderer/core/LayoutMetrics.h>
#include <ABI47_0_0React/ABI47_0_0renderer/core/State.h>
#include <ABI47_0_0React/ABI47_0_0renderer/debug/debugStringConvertibleUtils.h>
#include <ABI47_0_0React/ABI47_0_0renderer/mounting/ShadowView.h>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

static const int NO_VIEW_TAG = -1;

class StubView final {
 public:
  using Shared = std::shared_ptr<StubView>;

  StubView() = default;
  StubView(StubView const &stubView) = default;

  operator ShadowView() const;

  void update(ShadowView const &shadowView);

  ComponentName componentName;
  ComponentHandle componentHandle;
  SurfaceId surfaceId;
  Tag tag;
  Props::Shared props;
  SharedEventEmitter eventEmitter;
  LayoutMetrics layoutMetrics;
  State::Shared state;
  std::vector<StubView::Shared> children;
  Tag parentTag{NO_VIEW_TAG};
};

bool operator==(StubView const &lhs, StubView const &rhs);
bool operator!=(StubView const &lhs, StubView const &rhs);

#if ABI47_0_0RN_DEBUG_STRING_CONVERTIBLE

std::string getDebugName(StubView const &stubView);

std::vector<DebugStringConvertibleObject> getDebugProps(
    StubView const &stubView,
    DebugStringConvertibleOptions options);
std::vector<StubView> getDebugChildren(
    StubView const &stubView,
    DebugStringConvertibleOptions options);

#endif

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
