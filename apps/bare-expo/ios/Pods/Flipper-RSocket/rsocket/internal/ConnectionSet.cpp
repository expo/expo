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

#include "rsocket/internal/ConnectionSet.h"

#include "rsocket/statemachine/RSocketStateMachine.h"

#include <folly/io/async/EventBase.h>

namespace rsocket {

ConnectionSet::ConnectionSet() {}

ConnectionSet::~ConnectionSet() {
  if (!shutDown_) {
    shutdownAndWait();
  }
}

void ConnectionSet::shutdownAndWait() {
  VLOG(1) << "Started ConnectionSet::shutdownAndWait";
  shutDown_ = true;

  SCOPE_EXIT {
    VLOG(1) << "Finished ConnectionSet::shutdownAndWait";
  };

  StateMachineMap map;

  // Move all the connections out of the synchronized map so we don't block
  // while closing the state machines.
  {
    const auto locked = machines_.lock();
    if (locked->empty()) {
      VLOG(2) << "No connections to close, early exit";
      return;
    }

    targetRemoves_ = removes_ + locked->size();
    map.swap(*locked);
  }

  VLOG(2) << "Need to close " << map.size() << " connections";

  for (auto& kv : map) {
    auto rsocket = std::move(kv.first);
    auto evb = kv.second;

    const auto close = [rs = std::move(rsocket)] {
      rs->close({}, StreamCompletionSignal::SOCKET_CLOSED);
    };

    // We could be closing on the same thread as the state machine.  In that
    // case, close the state machine inline, otherwise we hang.
    if (evb->isInEventBaseThread()) {
      VLOG(3) << "Closing connection inline";
      close();
    } else {
      VLOG(3) << "Closing connection asynchronously";
      evb->runInEventBaseThread(close);
    }
  }

  VLOG(2) << "Waiting for connections to close";
  shutdownDone_.wait();
  VLOG(2) << "Connections have closed";
}

bool ConnectionSet::insert(
    std::shared_ptr<RSocketStateMachine> machine,
    folly::EventBase* evb) {
  VLOG(4) << "insert(" << machine.get() << ", " << evb << ")";

  if (shutDown_) {
    return false;
  }
  machines_.lock()->emplace(std::move(machine), evb);
  return true;
}

void ConnectionSet::remove(RSocketStateMachine& machine) {
  VLOG(4) << "remove(" << &machine << ")";

  const auto locked = machines_.lock();
  auto const result = locked->erase(machine.shared_from_this());
  DCHECK_LE(result, 1);

  if (++removes_ == targetRemoves_) {
    shutdownDone_.post();
  }
}

size_t ConnectionSet::size() const {
  return machines_.lock()->size();
}

} // namespace rsocket
