/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI41_0_0StubView.h"

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

void StubView::update(ShadowView const &shadowView) {
  componentName = shadowView.componentName;
  componentHandle = shadowView.componentHandle;
  tag = shadowView.tag;
  props = shadowView.props;
  eventEmitter = shadowView.eventEmitter;
  layoutMetrics = shadowView.layoutMetrics;
  state = shadowView.state;
}

bool operator==(StubView const &lhs, StubView const &rhs) {
  return std::tie(lhs.props, lhs.layoutMetrics) ==
      std::tie(rhs.props, rhs.layoutMetrics);
}

bool operator!=(StubView const &lhs, StubView const &rhs) {
  return !(lhs == rhs);
}

#if ABI41_0_0RN_DEBUG_STRING_CONVERTIBLE

std::string getDebugName(StubView const &stubView) {
  return std::string{"Stub"} +
      std::string{stubView.componentHandle ? stubView.componentName
                                           : "[invalid]"};
}

std::vector<DebugStringConvertibleObject> getDebugProps(
    StubView const &stubView,
    DebugStringConvertibleOptions options) {
  return {
      {"tag", getDebugDescription(stubView.tag, options)},
      {"props", getDebugDescription(stubView.props, options)},
      {"eventEmitter", getDebugDescription(stubView.eventEmitter, options)},
      {"layoutMetrics", getDebugDescription(stubView.layoutMetrics, options)},
      {"state", getDebugDescription(stubView.state, options)},
  };
}

std::vector<StubView> getDebugChildren(
    StubView const &stubView,
    DebugStringConvertibleOptions options) {
  std::vector<StubView> result;
  for (auto const &child : stubView.children) {
    result.push_back(*child);
  }
  return result;
}

#endif

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook
