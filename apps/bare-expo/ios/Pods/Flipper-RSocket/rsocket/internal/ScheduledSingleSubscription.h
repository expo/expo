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

#include "yarpl/single/SingleSubscription.h"

namespace folly {
class EventBase;
}

namespace rsocket {

//
// A decorator of the SingleSubscription object which schedules the method calls
// on the provided EventBase
//
class ScheduledSingleSubscription : public yarpl::single::SingleSubscription {
 public:
  ScheduledSingleSubscription(
      std::shared_ptr<yarpl::single::SingleSubscription> inner,
      folly::EventBase& eventBase);

  void cancel() override;

 private:
  const std::shared_ptr<yarpl::single::SingleSubscription> inner_;
  folly::EventBase& eventBase_;
};

} // namespace rsocket
