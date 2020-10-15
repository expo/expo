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

#include "rsocket/RSocketStats.h"

namespace rsocket {

class NoopStats : public RSocketStats {
 public:
  NoopStats() = default;
  NoopStats(const NoopStats&) = delete; // non construction-copyable
  NoopStats& operator=(const NoopStats&) = delete; // non copyable
  NoopStats& operator=(const NoopStats&&) = delete; // non movable
  NoopStats(NoopStats&&) = delete; // non construction-movable
  ~NoopStats() override = default;

  void socketCreated() override {}
  void socketConnected() override {}
  void socketDisconnected() override {}
  void socketClosed(StreamCompletionSignal) override {}

  void serverConnectionAccepted() override {}

  void duplexConnectionCreated(const std::string&, rsocket::DuplexConnection*)
      override {}

  void duplexConnectionClosed(const std::string&, rsocket::DuplexConnection*)
      override {}

  void bytesWritten(size_t) override {}
  void bytesRead(size_t) override {}
  void frameWritten(FrameType) override {}
  void frameRead(FrameType) override {}
  void serverResume(folly::Optional<int64_t>, int64_t, int64_t, ResumeOutcome)
      override {}
  void resumeBufferChanged(int, int) override {}
  void streamBufferChanged(int64_t, int64_t) override {}

  void resumeFailedNoState() override {}

  void keepaliveSent() override {}
  void keepaliveReceived() override {}

  static std::shared_ptr<NoopStats> instance() {
    static const auto singleton = std::make_shared<NoopStats>();
    return singleton;
  }
};

std::shared_ptr<RSocketStats> RSocketStats::noop() {
  return NoopStats::instance();
}
} // namespace rsocket
