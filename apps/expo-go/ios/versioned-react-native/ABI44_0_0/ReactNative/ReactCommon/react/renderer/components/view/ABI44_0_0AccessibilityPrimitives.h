/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cinttypes>

namespace ABI44_0_0facebook {
namespace ABI44_0_0React {

enum class AccessibilityTraits : uint32_t {
  None = 0,
  Button = (1 << 0),
  Link = (1 << 1),
  Image = (1 << 2),
  Selected = (1 << 3),
  PlaysSound = (1 << 4),
  KeyboardKey = (1 << 5),
  StaticText = (1 << 6),
  SummaryElement = (1 << 7),
  NotEnabled = (1 << 8),
  UpdatesFrequently = (1 << 9),
  SearchField = (1 << 10),
  StartsMediaSession = (1 << 11),
  Adjustable = (1 << 12),
  AllowsDirectInteraction = (1 << 13),
  CausesPageTurn = (1 << 14),
  Header = (1 << 15),
  Switch = (1 << 16),
};

constexpr enum AccessibilityTraits operator|(
    const enum AccessibilityTraits lhs,
    const enum AccessibilityTraits rhs) {
  return (enum AccessibilityTraits)((uint32_t)lhs | (uint32_t)rhs);
}

constexpr enum AccessibilityTraits operator&(
    const enum AccessibilityTraits lhs,
    const enum AccessibilityTraits rhs) {
  return (enum AccessibilityTraits)((uint32_t)lhs & (uint32_t)rhs);
}

struct AccessibilityState {
  bool disabled{false};
  bool selected{false};
  enum { Unchecked, Checked, Mixed, None } checked{None};
  bool busy{false};
  bool expanded{false};
};

constexpr bool operator==(
    AccessibilityState const &lhs,
    AccessibilityState const &rhs) {
  return lhs.disabled == rhs.disabled && lhs.selected == rhs.selected &&
      lhs.checked == rhs.checked && lhs.busy == rhs.busy &&
      lhs.expanded == rhs.expanded;
}

constexpr bool operator!=(
    AccessibilityState const &lhs,
    AccessibilityState const &rhs) {
  return !(rhs == lhs);
}

enum class ImportantForAccessibility {
  Auto,
  Yes,
  No,
  NoHideDescendants,
};

} // namespace ABI44_0_0React
} // namespace ABI44_0_0facebook
