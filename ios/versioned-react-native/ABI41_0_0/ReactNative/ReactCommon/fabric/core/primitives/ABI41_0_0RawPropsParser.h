/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <better/map.h>
#include <better/small_vector.h>
#include <ABI41_0_0React/core/Props.h>
#include <ABI41_0_0React/core/RawProps.h>
#include <ABI41_0_0React/core/RawPropsKey.h>
#include <ABI41_0_0React/core/RawPropsKeyMap.h>
#include <ABI41_0_0React/core/RawPropsPrimitives.h>
#include <ABI41_0_0React/core/RawValue.h>

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

/*
 * Specialized (to a particular type of Props) parser that provides the most
 * efficient access to `RawProps` content.
 */
class RawPropsParser final {
 public:
  /*
   * Default constructor.
   * To be used by `ConcreteComponentDescriptor` only.
   */
  RawPropsParser() = default;

  /*
   * To be used by `ConcreteComponentDescriptor` only.
   */
  template <typename PropsT>
  void prepare() noexcept {
    static_assert(
        std::is_base_of<Props, PropsT>::value,
        "PropsT must be a descendant of Props");
    RawProps emptyRawProps{};
    emptyRawProps.parse(*this);
    PropsT({}, emptyRawProps);
    postPrepare();
  }

 private:
  friend class ComponentDescriptor;
  template <class ShadowNodeT>
  friend class ConcreteComponentDescriptor;
  friend class RawProps;

  /*
   * To be used by `RawProps` only.
   */
  void preparse(RawProps const &rawProps) const noexcept;

  /*
   * Non-generic part of `prepare`.
   */
  void postPrepare() noexcept;

  /*
   * To be used by `RawProps` only.
   */
  RawValue const *at(RawProps const &rawProps, RawPropsKey const &key) const
      noexcept;

  mutable better::small_vector<RawPropsKey, kNumberOfPropsPerComponentSoftCap>
      keys_{};
  mutable RawPropsKeyMap nameToIndex_{};
  mutable int size_{0};
  mutable bool ready_{false};
};

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook
