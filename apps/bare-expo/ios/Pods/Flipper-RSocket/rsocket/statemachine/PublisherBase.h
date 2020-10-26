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

#include "rsocket/internal/Allowance.h"
#include "yarpl/flowable/Subscription.h"

namespace rsocket {

/// A class that represents a flow-control-aware producer of data.
class PublisherBase {
 public:
  explicit PublisherBase(uint32_t initialRequestN);

  void publisherSubscribe(std::shared_ptr<yarpl::flowable::Subscription>);

  void processRequestN(uint32_t);
  void publisherComplete();

  bool publisherClosed() const;
  void terminatePublisher();

 private:
  enum class State : uint8_t {
    RESPONDING,
    CLOSED,
  };

  std::shared_ptr<yarpl::flowable::Subscription> producingSubscription_;
  Allowance initialRequestN_;
  State state_{State::RESPONDING};
};

} // namespace rsocket
