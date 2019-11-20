// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <folly/Hash.h>
#include <ReactABI34_0_0/core/LayoutMetrics.h>
#include <ReactABI34_0_0/core/LocalData.h>
#include <ReactABI34_0_0/core/Props.h>
#include <ReactABI34_0_0/core/ReactABI34_0_0Primitives.h>
#include <ReactABI34_0_0/core/ShadowNode.h>
#include <ReactABI34_0_0/events/EventEmitter.h>

namespace facebook {
namespace ReactABI34_0_0 {

/*
 * Describes a view that can be mounted.
 */
struct ShadowView final {
  ShadowView() = default;
  ShadowView(const ShadowView &shadowView) = default;

  /*
   * Constructs a `ShadowView` from given `ShadowNode`.
   */
  explicit ShadowView(const ShadowNode &shadowNode);

  ShadowView &operator=(const ShadowView &other) = default;

  bool operator==(const ShadowView &rhs) const;
  bool operator!=(const ShadowView &rhs) const;

  ComponentName componentName = "";
  ComponentHandle componentHandle = 0;
  Tag tag = -1; // Tag does not change during the lifetime of a shadow view.
  SharedProps props = {};
  SharedEventEmitter eventEmitter = {};
  LayoutMetrics layoutMetrics = EmptyLayoutMetrics;
  SharedLocalData localData = {};
};

/*
 * Describes pair of a `ShadowView` and a `ShadowNode`.
 */
struct ShadowViewNodePair final {
  const ShadowView shadowView;
  const ShadowNode &shadowNode;

  /*
   * The stored pointer to `ShadowNode` represents an indentity of the pair.
   */
  bool operator==(const ShadowViewNodePair &rhs) const;
  bool operator!=(const ShadowViewNodePair &rhs) const;
};

using ShadowViewNodePairList = std::vector<ShadowViewNodePair>;

} // namespace ReactABI34_0_0
} // namespace facebook

namespace std {

template <>
struct hash<facebook::ReactABI34_0_0::ShadowView> {
  size_t operator()(const facebook::ReactABI34_0_0::ShadowView &shadowView) const {
    auto seed = size_t{0};
    folly::hash::hash_combine(
        seed,
        shadowView.componentHandle,
        shadowView.tag,
        shadowView.props,
        shadowView.eventEmitter,
        shadowView.localData);
    return seed;
  }
};

} // namespace std
