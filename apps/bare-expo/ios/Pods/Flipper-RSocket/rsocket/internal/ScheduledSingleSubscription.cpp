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

#include "rsocket/internal/ScheduledSingleSubscription.h"

#include <folly/io/async/EventBase.h>

namespace rsocket {

ScheduledSingleSubscription::ScheduledSingleSubscription(
    std::shared_ptr<yarpl::single::SingleSubscription> inner,
    folly::EventBase& eventBase)
    : inner_(std::move(inner)), eventBase_(eventBase) {}

void ScheduledSingleSubscription::cancel() {
  if (eventBase_.isInEventBaseThread()) {
    inner_->cancel();
  } else {
    eventBase_.runInEventBaseThread([inner = inner_] { inner->cancel(); });
  }
}

} // namespace rsocket
