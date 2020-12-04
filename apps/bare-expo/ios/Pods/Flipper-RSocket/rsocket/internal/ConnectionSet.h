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

#include <folly/Synchronized.h>
#include <folly/synchronization/Baton.h>

#include <memory>
#include <mutex>
#include <unordered_map>

#include "rsocket/statemachine/RSocketStateMachine.h"

namespace folly {
class EventBase;
}

namespace rsocket {

/// Set of RSocketStateMachine objects.  Stores them until they call
/// RSocketStateMachine::close().
///
/// Also tracks which EventBase is controlling each state machine so that they
/// can be closed on the correct thread.
class ConnectionSet : public RSocketStateMachine::CloseCallback {
 public:
  ConnectionSet();
  virtual ~ConnectionSet();

  bool insert(std::shared_ptr<RSocketStateMachine>, folly::EventBase*);
  void remove(RSocketStateMachine&) override;

  size_t size() const;

  void shutdownAndWait();

 private:
  using StateMachineMap = std::
      unordered_map<std::shared_ptr<RSocketStateMachine>, folly::EventBase*>;

  folly::Synchronized<StateMachineMap, std::mutex> machines_;
  folly::Baton<> shutdownDone_;
  size_t removes_{0};
  size_t targetRemoves_{0};
  std::atomic<bool> shutDown_{false};
};

} // namespace rsocket
