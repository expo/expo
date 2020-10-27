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

#include <folly/io/async/EventBase.h>

#include "rsocket/framing/FrameTransport.h"

namespace rsocket {

// This class is a wrapper around FrameTransport which ensures all methods of
// FrameTransport get executed in a particular EventBase.
//
// This is currently used in the server where the resumed Transport of the
// client is on a different EventBase compared to the EventBase on which the
// original RSocketStateMachine was constructed for the client.  Here the
// RSocketStateMachine uses this class to schedule events of the Transport in
// the new EventBase.
class ScheduledFrameTransport : public FrameTransport {
 public:
  ScheduledFrameTransport(
      std::shared_ptr<FrameTransport> frameTransport,
      folly::EventBase* transportEvb,
      folly::EventBase* stateMachineEvb)
      : transportEvb_(transportEvb),
        stateMachineEvb_(stateMachineEvb),
        frameTransport_(std::move(frameTransport)) {}

  ~ScheduledFrameTransport();

  void setFrameProcessor(std::shared_ptr<FrameProcessor>) override;
  void outputFrameOrDrop(std::unique_ptr<folly::IOBuf>) override;
  void close() override;
  bool isConnectionFramed() const override;

 private:
  DuplexConnection* getConnection() override {
    DLOG(FATAL)
        << "ScheduledFrameTransport doesn't support getConnection method, "
           "because it can create safe usage issues when EventBase of the "
           "transport and the RSocketClient is not the same.";
    return nullptr;
  }

 private:
  folly::EventBase* const transportEvb_;
  folly::EventBase* const stateMachineEvb_;
  std::shared_ptr<FrameTransport> frameTransport_;
};

} // namespace rsocket
