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

#include <folly/Range.h>

namespace rsocket {

enum class FrameType : uint8_t {
  RESERVED = 0x00,
  SETUP = 0x01,
  LEASE = 0x02,
  KEEPALIVE = 0x03,
  REQUEST_RESPONSE = 0x04,
  REQUEST_FNF = 0x05,
  REQUEST_STREAM = 0x06,
  REQUEST_CHANNEL = 0x07,
  REQUEST_N = 0x08,
  CANCEL = 0x09,
  PAYLOAD = 0x0A,
  ERROR = 0x0B,
  METADATA_PUSH = 0x0C,
  RESUME = 0x0D,
  RESUME_OK = 0x0E,
  EXT = 0x3F,
};

folly::StringPiece toString(FrameType);

std::ostream& operator<<(std::ostream&, FrameType);

} // namespace rsocket
