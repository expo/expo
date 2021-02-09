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

#include "yarpl/flowable/Subscription.h"

namespace rsocket {

// A wrapper over Subscription that schedules all of the subscription's methods
// on an EventBase.
class ScheduledSubscription : public yarpl::flowable::Subscription {
 public:
  ScheduledSubscription(
      std::shared_ptr<yarpl::flowable::Subscription>,
      folly::EventBase&);

  void request(int64_t) override;
  void cancel() override;

 private:
  std::shared_ptr<yarpl::flowable::Subscription> inner_;
  folly::EventBase& eventBase_;
};

} // namespace rsocket
