/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#pragma once

#include <ostream>

#include <folly/net/detail/SocketFileDescriptorMap.h>
#include <folly/portability/Windows.h>

namespace folly {
/**
 * This is just a very thin wrapper around either a file descriptor or
 * a SOCKET depending on platform, along with a couple of helper methods
 * for explicitly converting to/from file descriptors, even on Windows.
 */
struct NetworkSocket {
#ifdef _WIN32
  using native_handle_type = SOCKET;
  static constexpr native_handle_type invalid_handle_value = INVALID_SOCKET;
#else
  using native_handle_type = int;
  static constexpr native_handle_type invalid_handle_value = -1;
#endif

  native_handle_type data;

  constexpr NetworkSocket() : data(invalid_handle_value) {}
  constexpr explicit NetworkSocket(native_handle_type d) : data(d) {}

  template <typename T>
  static NetworkSocket fromFd(T) = delete;
  static NetworkSocket fromFd(int fd) {
    return NetworkSocket(
        netops::detail::SocketFileDescriptorMap::fdToSocket(fd));
  }

  int toFd() const {
    return netops::detail::SocketFileDescriptorMap::socketToFd(data);
  }

  friend constexpr bool operator==(
      const NetworkSocket& a,
      const NetworkSocket& b) noexcept {
    return a.data == b.data;
  }

  friend constexpr bool operator!=(
      const NetworkSocket& a,
      const NetworkSocket& b) noexcept {
    return !(a == b);
  }
};

template <class CharT, class Traits>
inline std::basic_ostream<CharT, Traits>& operator<<(
    std::basic_ostream<CharT, Traits>& os,
    const NetworkSocket& addr) {
  os << "folly::NetworkSocket(" << addr.data << ")";
  return os;
}
} // namespace folly

namespace std {
template <>
struct hash<folly::NetworkSocket> {
  size_t operator()(const folly::NetworkSocket& s) const noexcept {
    return std::hash<folly::NetworkSocket::native_handle_type>()(s.data);
  }
};
} // namespace std
