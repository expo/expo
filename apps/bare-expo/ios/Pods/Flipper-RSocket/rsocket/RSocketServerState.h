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

#include "rsocket/RSocketRequester.h"

namespace folly {
class EventBase;
}

namespace rsocket {

class RSocketServerState {
 public:
  void close() {
    eventBase_.runInEventBaseThread([sm = rSocketStateMachine_] {
      sm->close({}, StreamCompletionSignal::SOCKET_CLOSED);
    });
  }

  std::shared_ptr<RSocketRequester> getRequester() {
    return rSocketRequester_;
  }

  folly::EventBase* eventBase() {
    return &eventBase_;
  }

  friend class RSocketServer;

 private:
  RSocketServerState(
      folly::EventBase& eventBase,
      std::shared_ptr<RSocketStateMachine> stateMachine,
      std::shared_ptr<RSocketRequester> rSocketRequester)
      : eventBase_(eventBase),
        rSocketStateMachine_(stateMachine),
        rSocketRequester_(rSocketRequester) {}

  folly::EventBase& eventBase_;
  const std::shared_ptr<RSocketStateMachine> rSocketStateMachine_;
  const std::shared_ptr<RSocketRequester> rSocketRequester_;
};
} // namespace rsocket
