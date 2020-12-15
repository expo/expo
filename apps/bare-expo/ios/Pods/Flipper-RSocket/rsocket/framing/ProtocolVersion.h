// Copyright (c) Facebook, Inc. and its affiliates.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#pragma once

#include <cstdint>
#include <iosfwd>

namespace rsocket {

// Bug in GCC: https://bugzilla.redhat.com/show_bug.cgi?id=130601
#pragma push_macro("major")
#pragma push_macro("minor")
#undef major
#undef minor

struct ProtocolVersion {
  uint16_t major{};
  uint16_t minor{};

  constexpr ProtocolVersion() = default;
  constexpr ProtocolVersion(uint16_t _major, uint16_t _minor)
      : major(_major), minor(_minor) {}

  static const ProtocolVersion Unknown;
  static const ProtocolVersion Latest;
};

#pragma pop_macro("major")
#pragma pop_macro("minor")

std::ostream& operator<<(std::ostream&, const ProtocolVersion&);

constexpr bool operator==(
    const ProtocolVersion& left,
    const ProtocolVersion& right) {
  return left.major == right.major && left.minor == right.minor;
}

constexpr bool operator!=(
    const ProtocolVersion& left,
    const ProtocolVersion& right) {
  return !(left == right);
}

constexpr bool operator<(
    const ProtocolVersion& left,
    const ProtocolVersion& right) {
  return left != ProtocolVersion::Unknown &&
      right != ProtocolVersion::Unknown &&
      (left.major < right.major ||
       (left.major == right.major && left.minor < right.minor));
}

constexpr bool operator>(
    const ProtocolVersion& left,
    const ProtocolVersion& right) {
  return left != ProtocolVersion::Unknown &&
      right != ProtocolVersion::Unknown &&
      (left.major > right.major ||
       (left.major == right.major && left.minor > right.minor));
}

} // namespace rsocket
