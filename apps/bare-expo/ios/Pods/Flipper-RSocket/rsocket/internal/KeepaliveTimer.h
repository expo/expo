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

#include "rsocket/statemachine/RSocketStateMachine.h"

namespace rsocket {

class KeepaliveTimer {
 public:
  KeepaliveTimer(std::chrono::milliseconds period, folly::EventBase& eventBase);

  ~KeepaliveTimer();

  std::chrono::milliseconds keepaliveTime() const;

  void schedule();

  void stop();

  void start(const std::shared_ptr<FrameSink>& connection);

  void sendKeepalive(FrameSink& sink);

  void keepaliveReceived();

 private:
  std::shared_ptr<FrameSink> connection_;
  folly::EventBase& eventBase_;
  const std::shared_ptr<uint32_t> generation_;
  const std::chrono::milliseconds period_;
  std::atomic<bool> pending_{false};
};
} // namespace rsocket
