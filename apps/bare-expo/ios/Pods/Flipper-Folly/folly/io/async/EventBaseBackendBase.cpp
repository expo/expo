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

#include <folly/io/async/EventBaseBackendBase.h>
#include <folly/io/async/EventBase.h>

namespace folly {
void EventBaseEvent::eb_ev_base(EventBase* evb) {
  evb_ = evb;
  event_.ev_base = evb ? evb->getLibeventBase() : nullptr;
}

int EventBaseEvent::eb_event_base_set(EventBase* evb) {
  evb_ = evb;
  auto* base = evb_ ? (evb_->getLibeventBase()) : nullptr;
  if (base) {
    return ::event_base_set(base, &event_);
  }

  return 0;
}

int EventBaseEvent::eb_event_add(const struct timeval* timeout) {
  auto* backend = evb_ ? (evb_->getBackend()) : nullptr;
  if (backend) {
    return backend->eb_event_add(*this, timeout);
  }

  return -1;
}

int EventBaseEvent::eb_event_del() {
  auto* backend = evb_ ? (evb_->getBackend()) : nullptr;
  if (backend) {
    return backend->eb_event_del(*this);
  }

  return -1;
}
} // namespace folly
