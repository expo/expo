/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

/*
 * An enum that represents ABI47_0_0React's event priority.
 * Used to map Fabric events to ABI47_0_0React.
 */
enum class ABI47_0_0ReactEventPriority {
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

static constexpr std::underlying_type<ABI47_0_0ReactEventPriority>::type serialize(
    ABI47_0_0ReactEventPriority ABI47_0_0ReactEventPriority) {
  return static_cast<std::underlying_type<ABI47_0_0ReactEventPriority>::type>(
      ABI47_0_0ReactEventPriority);
}

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
