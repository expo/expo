/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#include <folly/io/async/AsyncSignalHandler.h>

#include <folly/io/async/EventBase.h>

#include <folly/Conv.h>

using std::make_pair;
using std::pair;
using std::string;

namespace folly {

AsyncSignalHandler::AsyncSignalHandler(EventBase* eventBase)
    : eventBase_(eventBase) {}

AsyncSignalHandler::~AsyncSignalHandler() {
  // Unregister any outstanding events
  for (auto& signalEvent : signalEvents_) {
    signalEvent.second->eb_event_del();
  }
}

void AsyncSignalHandler::attachEventBase(EventBase* eventBase) {
  assert(eventBase_ == nullptr);
  assert(signalEvents_.empty());
  eventBase_ = eventBase;
}

void AsyncSignalHandler::detachEventBase() {
  assert(eventBase_ != nullptr);
  assert(signalEvents_.empty());
  eventBase_ = nullptr;
}

void AsyncSignalHandler::registerSignalHandler(int signum) {
  pair<SignalEventMap::iterator, bool> ret = signalEvents_.insert(
      make_pair(signum, std::make_unique<EventBaseEvent>()));
  if (!ret.second) {
    // This signal has already been registered
    throw std::runtime_error(
        folly::to<string>("handler already registered for signal ", signum));
  }

  EventBaseEvent* ev = ret.first->second.get();
  try {
    ev->eb_signal_set(signum, libeventCallback, this);
    if (ev->eb_event_base_set(eventBase_) != 0) {
      throw std::runtime_error(folly::to<string>(
          "error initializing event handler for signal ", signum));
    }

    if (ev->eb_event_add(nullptr) != 0) {
      throw std::runtime_error(
          folly::to<string>("error adding event handler for signal ", signum));
    }
  } catch (...) {
    signalEvents_.erase(ret.first);
    throw;
  }
}

void AsyncSignalHandler::unregisterSignalHandler(int signum) {
  auto it = signalEvents_.find(signum);
  if (it == signalEvents_.end()) {
    throw std::runtime_error(folly::to<string>(
        "unable to unregister handler for signal ",
        signum,
        ": signal not registered"));
  }

  it->second->eb_event_del();
  signalEvents_.erase(it);
}

void AsyncSignalHandler::libeventCallback(
    libevent_fd_t signum,
    short /* events */,
    void* arg) {
  auto handler = static_cast<AsyncSignalHandler*>(arg);
  handler->signalReceived(int(signum));
}

} // namespace folly
