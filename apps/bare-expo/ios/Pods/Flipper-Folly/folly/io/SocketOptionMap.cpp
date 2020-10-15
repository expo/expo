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

#include <folly/io/SocketOptionMap.h>
#include <folly/net/NetworkSocket.h>

#include <errno.h>

namespace folly {

const SocketOptionMap emptySocketOptionMap;

int SocketOptionKey::apply(NetworkSocket fd, int val) const {
  return netops::setsockopt(fd, level, optname, &val, sizeof(val));
}

int applySocketOptions(
    NetworkSocket fd,
    const SocketOptionMap& options,
    SocketOptionKey::ApplyPos pos) {
  for (const auto& opt : options) {
    if (opt.first.applyPos_ == pos) {
      auto rv = opt.first.apply(fd, opt.second);
      if (rv != 0) {
        return errno;
      }
    }
  }
  return 0;
}

SocketOptionMap validateSocketOptions(
    const SocketOptionMap& options,
    sa_family_t family,
    SocketOptionKey::ApplyPos pos) {
  SocketOptionMap validOptions;
  for (const auto& option : options) {
    if (pos != option.first.applyPos_) {
      continue;
    }
    if ((family == AF_INET && option.first.level == IPPROTO_IP) ||
        (family == AF_INET6 && option.first.level == IPPROTO_IPV6) ||
        option.first.level == IPPROTO_UDP || option.first.level == SOL_SOCKET ||
        option.first.level == SOL_UDP) {
      validOptions.insert(option);
    }
  }
  return validOptions;
}

} // namespace folly
