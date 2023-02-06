/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI48_0_0butter/ABI48_0_0small_vector.h>
#include <folly/Hash.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/EventEmitter.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/LayoutMetrics.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/Props.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/ABI48_0_0ReactPrimitives.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/ShadowNode.h>
#include <ABI48_0_0React/ABI48_0_0renderer/debug/flags.h>

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

/*
 * Describes a view that can be mounted.
 * This is exposed to the mounting layer.
 */
struct ShadowView final {
  ShadowView() = default;
  ShadowView(ShadowView const &shadowView) = default;
  ShadowView(ShadowView &&shadowView) noexcept = default;

  /*
   * Constructs a `ShadowView` from given `ShadowNode`.
   */
  explicit ShadowView(ShadowNode const &shadowNode);

  ShadowView &operator=(ShadowView const &other) = default;
  ShadowView &operator=(ShadowView &&other) = default;

  bool operator==(ShadowView const &rhs) const;
  bool operator!=(ShadowView const &rhs) const;

  ComponentName componentName{};
  ComponentHandle componentHandle{};
  SurfaceId surfaceId{};
  Tag tag{};
  ShadowNodeTraits traits{};
  Props::Shared props{};
  EventEmitter::Shared eventEmitter{};
  LayoutMetrics layoutMetrics{EmptyLayoutMetrics};
  State::Shared state{};
};

#if ABI48_0_0RN_DEBUG_STRING_CONVERTIBLE

std::string getDebugName(ShadowView const &object);
std::vector<DebugStringConvertibleObject> getDebugProps(
    ShadowView const &object,
    DebugStringConvertibleOptions options);

#endif

/*
 * Describes pair of a `ShadowView` and a `ShadowNode`.
 * This is not exposed to the mounting layer.
 *
 */
struct ShadowViewNodePair final {
  using NonOwningList = butter::
      small_vector<ShadowViewNodePair *, kShadowNodeChildrenSmallVectorSize>;
  using OwningList = butter::
      small_vector<ShadowViewNodePair, kShadowNodeChildrenSmallVectorSize>;

  ShadowView shadowView;
  ShadowNode const *shadowNode;
  bool flattened{false};
  bool isConcreteView{true};
  Point contextOrigin{0, 0};

  size_t mountIndex{0};

  /**
   * This is nullptr unless `inOtherTree` is set to true.
   * We rely on this only for marginal cases. TODO: could we
   * rely on this more heavily to simplify the diffing algorithm
   * overall?
   */
  mutable ShadowViewNodePair const *otherTreePair{nullptr};

  /*
   * The stored pointer to `ShadowNode` represents an identity of the pair.
   */
  bool operator==(const ShadowViewNodePair &rhs) const;
  bool operator!=(const ShadowViewNodePair &rhs) const;

  bool inOtherTree() const {
    return this->otherTreePair != nullptr;
  }
};

/*
 * Describes pair of a `ShadowView` and a `ShadowNode`.
 * This is not exposed to the mounting layer.
 *
 */
struct ShadowViewNodePairLegacy final {
  using OwningList = butter::small_vector<
      ShadowViewNodePairLegacy,
      kShadowNodeChildrenSmallVectorSize>;

  ShadowView shadowView;
  ShadowNode const *shadowNode;
  bool flattened{false};
  bool isConcreteView{true};

  size_t mountIndex{0};

  bool inOtherTree{false};

  /*
   * The stored pointer to `ShadowNode` represents an identity of the pair.
   */
  bool operator==(const ShadowViewNodePairLegacy &rhs) const;
  bool operator!=(const ShadowViewNodePairLegacy &rhs) const;
};

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook

namespace std {

template <>
struct hash<ABI48_0_0facebook::ABI48_0_0React::ShadowView> {
  size_t operator()(const ABI48_0_0facebook::ABI48_0_0React::ShadowView &shadowView) const {
    return folly::hash::hash_combine(
        0,
        shadowView.surfaceId,
        shadowView.componentHandle,
        shadowView.tag,
        shadowView.props,
        shadowView.eventEmitter,
        shadowView.layoutMetrics,
        shadowView.state);
  }
};

} // namespace std
