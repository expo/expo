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

#include "rsocket/DuplexConnection.h"
#include "rsocket/RSocketStats.h"

namespace rsocket {
class StatsPrinter : public RSocketStats {
 public:
  void socketCreated() override;
  void socketClosed(StreamCompletionSignal signal) override;
  void socketDisconnected() override;

  void duplexConnectionCreated(
      const std::string& type,
      rsocket::DuplexConnection* connection) override;
  void duplexConnectionClosed(
      const std::string& type,
      rsocket::DuplexConnection* connection) override;

  void bytesWritten(size_t bytes) override;
  void bytesRead(size_t bytes) override;
  void frameWritten(FrameType frameType) override;
  void frameRead(FrameType frameType) override;
  void resumeBufferChanged(int framesCountDelta, int dataSizeDelta) override;
  void streamBufferChanged(int64_t framesCountDelta, int64_t dataSizeDelta)
      override;

  void keepaliveSent() override;
  void keepaliveReceived() override;
};
} // namespace rsocket
