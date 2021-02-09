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

#include <memory>

#include <gmock/gmock.h>

#include "rsocket/Payload.h"
#include "rsocket/RSocketStats.h"
#include "rsocket/transports/tcp/TcpDuplexConnection.h"

namespace rsocket {

class MockStats : public RSocketStats {
 public:
  MOCK_METHOD0(socketCreated, void());
  MOCK_METHOD1(socketClosed, void(StreamCompletionSignal));
  MOCK_METHOD0(socketDisconnected, void());

  MOCK_METHOD2(
      duplexConnectionCreated,
      void(const std::string&, rsocket::DuplexConnection*));
  MOCK_METHOD2(
      duplexConnectionClosed,
      void(const std::string&, rsocket::DuplexConnection*));

  MOCK_METHOD1(bytesWritten, void(size_t));
  MOCK_METHOD1(bytesRead, void(size_t));
  MOCK_METHOD1(frameWritten, void(FrameType));
  MOCK_METHOD1(frameRead, void(FrameType));
  MOCK_METHOD2(resumeBufferChanged, void(int, int));
  MOCK_METHOD2(streamBufferChanged, void(int64_t, int64_t));
};
} // namespace rsocket
