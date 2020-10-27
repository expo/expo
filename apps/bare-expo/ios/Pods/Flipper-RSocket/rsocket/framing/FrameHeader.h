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

#include <iosfwd>

#include "rsocket/framing/FrameFlags.h"
#include "rsocket/framing/FrameType.h"
#include "rsocket/internal/Common.h"

namespace rsocket {

/// Header that begins every RSocket frame.
class FrameHeader {
 public:
  FrameHeader() {}

  FrameHeader(FrameType ty, FrameFlags fflags, StreamId stream)
      : type{ty}, flags{fflags}, streamId{stream} {}

  bool flagsComplete() const {
    return !!(flags & FrameFlags::COMPLETE);
  }

  bool flagsNext() const {
    return !!(flags & FrameFlags::NEXT);
  }

  bool flagsFollows() const {
    return !!(flags & FrameFlags::FOLLOWS);
  }

  FrameType type{FrameType::RESERVED};
  FrameFlags flags{FrameFlags::EMPTY_};
  StreamId streamId{0};
};

std::ostream& operator<<(std::ostream&, const FrameHeader&);

} // namespace rsocket
