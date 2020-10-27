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

#include <folly/net/NetworkSocket.h>
#include <folly/portability/Sockets.h>

#include <map>

namespace folly {

/**
 * Uniquely identifies a handle to a socket option value. Each
 * combination of level and option name corresponds to one socket
 * option value.
 */
class SocketOptionKey {
 public:
  enum class ApplyPos { POST_BIND = 0, PRE_BIND = 1 };

  bool operator<(const SocketOptionKey& other) const {
    if (level == other.level) {
      return optname < other.optname;
    }
    return level < other.level;
  }

  int apply(NetworkSocket fd, int val) const;

  int level;
  int optname;
  ApplyPos applyPos_{ApplyPos::POST_BIND};
};

// Maps from a socket option key to its value
using SocketOptionMap = std::map<SocketOptionKey, int>;

extern const SocketOptionMap emptySocketOptionMap;

int applySocketOptions(
    NetworkSocket fd,
    const SocketOptionMap& options,
    SocketOptionKey::ApplyPos pos);

SocketOptionMap validateSocketOptions(
    const SocketOptionMap& options,
    sa_family_t family,
    SocketOptionKey::ApplyPos pos);

} // namespace folly
