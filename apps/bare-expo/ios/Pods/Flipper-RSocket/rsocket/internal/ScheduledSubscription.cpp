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

#include "rsocket/internal/ScheduledSubscription.h"

namespace rsocket {

ScheduledSubscription::ScheduledSubscription(
    std::shared_ptr<yarpl::flowable::Subscription> inner,
    folly::EventBase& eventBase)
    : inner_{std::move(inner)}, eventBase_{eventBase} {}

void ScheduledSubscription::request(int64_t n) {
  if (eventBase_.isInEventBaseThread()) {
    inner_->request(n);
  } else {
    eventBase_.runInEventBaseThread([inner = inner_, n] { inner->request(n); });
  }
}

void ScheduledSubscription::cancel() {
  if (eventBase_.isInEventBaseThread()) {
    auto inner = std::move(inner_);
    inner->cancel();
  } else {
    eventBase_.runInEventBaseThread(
        [inner = std::move(inner_)] { inner->cancel(); });
  }
}

} // namespace rsocket
