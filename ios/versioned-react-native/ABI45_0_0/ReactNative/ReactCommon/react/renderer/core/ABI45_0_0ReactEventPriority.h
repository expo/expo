/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace ABI45_0_0facebook {
namespace ABI45_0_0React {

/*
 * An enum that represents ABI45_0_0React's event priority.
 * Used to map Fabric events to ABI45_0_0React.
 */
enum class ABI45_0_0ReactEventPriority {
  /*
   * Event priority is unspecified.
   */
  Default,

  /*
   * User events that happen at discrete times, like
   * input into text field.
   */
  Discrete,

  /*
   * “fluid” user events that happen many times over a short period of time like
   * scrolling.
   */
  Continuous,
};

static constexpr std::underlying_type<ABI45_0_0ReactEventPriority>::type serialize(
    ABI45_0_0ReactEventPriority ABI45_0_0ReactEventPriority) {
  return static_cast<std::underlying_type<ABI45_0_0ReactEventPriority>::type>(
      ABI45_0_0ReactEventPriority);
}

} // namespace ABI45_0_0React
} // namespace ABI45_0_0facebook
