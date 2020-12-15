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

#include <folly/io/IOBuf.h>

#include "rsocket/DuplexConnection.h"
#include "rsocket/framing/FrameProcessor.h"

namespace rsocket {

// Refer to FrameTransportImpl for documentation on the implementation
class FrameTransport {
 public:
  virtual ~FrameTransport() = default;
  virtual void setFrameProcessor(std::shared_ptr<FrameProcessor>) = 0;
  virtual void outputFrameOrDrop(std::unique_ptr<folly::IOBuf>) = 0;
  virtual void close() = 0;

  // Just for observation purposes!
  // TODO(T25011919): remove
  virtual DuplexConnection* getConnection() = 0;

  virtual bool isConnectionFramed() const = 0;
};
} // namespace rsocket
