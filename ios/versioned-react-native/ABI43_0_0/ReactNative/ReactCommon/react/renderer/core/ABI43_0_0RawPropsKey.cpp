/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI43_0_0RawPropsKey.h"

#include <cassert>
#include <cstring>

#include <ABI43_0_0React/ABI43_0_0renderer/core/RawPropsPrimitives.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

void RawPropsKey::render(char *buffer, RawPropsPropNameLength *length) const
    noexcept {
  *length = 0;

  // Prefix
  if (prefix) {
    auto prefixLength = std::strlen(prefix);
    std::memcpy(buffer, prefix, prefixLength);
    *length = prefixLength;
  }

  // Name
  auto nameLength = std::strlen(name);
  std::memcpy(buffer + *length, name, nameLength);
  *length += nameLength;

  // Suffix
  if (suffix) {
    int suffixLength = std::strlen(suffix);
    std::memcpy(buffer + *length, suffix, suffixLength);
    *length += suffixLength;
  }
  assert(*length < kPropNameLengthHardCap);
}

RawPropsKey::operator std::string() const noexcept {
  char buffer[kPropNameLengthHardCap];
  RawPropsPropNameLength length = 0;
  render(buffer, &length);
  assert(length < kPropNameLengthHardCap);
  return std::string{buffer, length};
}

bool operator==(RawPropsKey const &lhs, RawPropsKey const &rhs) noexcept {
  // Note: We check the name first.
  return lhs.name == rhs.name && lhs.prefix == rhs.prefix &&
      lhs.suffix == rhs.suffix;
}

bool operator!=(RawPropsKey const &lhs, RawPropsKey const &rhs) noexcept {
  return !(lhs == rhs);
}

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
