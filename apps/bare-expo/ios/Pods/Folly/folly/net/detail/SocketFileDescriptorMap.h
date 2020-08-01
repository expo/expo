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

#include <folly/portability/Windows.h>

#ifndef _WIN32
// This can't go via the portability header, because
// the portability header depends on us.
#include <unistd.h>
#endif

namespace folly {
namespace netops {
namespace detail {
struct SocketFileDescriptorMap {
#ifdef _WIN32
  static int close(int fd) noexcept;
  static int close(SOCKET sock) noexcept;

  static SOCKET fdToSocket(int fd) noexcept;
  static int socketToFd(SOCKET sock) noexcept;
#else
  static int close(int fd) noexcept {
    return ::close(fd);
  }

  static int fdToSocket(int fd) noexcept {
    return fd;
  }
  static int socketToFd(int sock) noexcept {
    return sock;
  }
#endif
};
} // namespace detail
} // namespace netops
} // namespace folly
