/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI49_0_0ShadowView.h"

#include <ABI49_0_0React/renderer/core/ABI49_0_0LayoutMetrics.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0LayoutableShadowNode.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0TraitCast.h>

namespace ABI49_0_0facebook::ABI49_0_0React {

static LayoutMetrics layoutMetricsFromShadowNode(ShadowNode const &shadowNode) {
  auto layoutableShadowNode =
      traitCast<LayoutableShadowNode const *>(&shadowNode);
  return layoutableShadowNode != nullptr
      ? layoutableShadowNode->getLayoutMetrics()
      : EmptyLayoutMetrics;
}

ShadowView::ShadowView(const ShadowNode &shadowNode)
    : componentName(shadowNode.getComponentName()),
      componentHandle(shadowNode.getComponentHandle()),
      surfaceId(shadowNode.getSurfaceId()),
      tag(shadowNode.getTag()),
      traits(shadowNode.getTraits()),
      props(shadowNode.getProps()),
      eventEmitter(shadowNode.getEventEmitter()),
      layoutMetrics(layoutMetricsFromShadowNode(shadowNode)),
      state(shadowNode.getState()) {}

bool ShadowView::operator==(const ShadowView &rhs) const {
  return std::tie(
             this->surfaceId,
             this->tag,
             this->componentName,
             this->props,
             this->eventEmitter,
             this->layoutMetrics,
             this->state) ==
      std::tie(
             rhs.surfaceId,
             rhs.tag,
             rhs.componentName,
             rhs.props,
             rhs.eventEmitter,
             rhs.layoutMetrics,
             rhs.state);
}

bool ShadowView::operator!=(const ShadowView &rhs) const {
  return !(*this == rhs);
}

#ifdef ABI49_0_0RN_DEBUG_STRING_CONVERTIBLE

std::string getDebugName(ShadowView const &object) {
  return object.componentHandle == 0 ? "Invalid" : object.componentName;
}

std::vector<DebugStringConvertibleObject> getDebugProps(
    ShadowView const &object,
    DebugStringConvertibleOptions options) {
  return {
      {"surfaceId", getDebugDescription(object.surfaceId, options)},
      {"tag", getDebugDescription(object.tag, options)},
      {"traits", getDebugDescription(object.traits, options)},
      {"componentName", object.componentName},
      {"props", getDebugDescription(object.props, options)},
      {"eventEmitter", getDebugDescription(object.eventEmitter, options)},
      {"layoutMetrics", getDebugDescription(object.layoutMetrics, options)},
      {"state", getDebugDescription(object.state, options)},
  };
}

#endif

bool ShadowViewNodePair::operator==(const ShadowViewNodePair &rhs) const {
  return this->shadowNode == rhs.shadowNode;
}

bool ShadowViewNodePair::operator!=(const ShadowViewNodePair &rhs) const {
  return !(*this == rhs);
}

bool ShadowViewNodePairLegacy::operator==(
    const ShadowViewNodePairLegacy &rhs) const {
  return this->shadowNode == rhs.shadowNode;
}

bool ShadowViewNodePairLegacy::operator!=(
    const ShadowViewNodePairLegacy &rhs) const {
  return !(*this == rhs);
}

} // namespace ABI49_0_0facebook::ABI49_0_0React
