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

#include "rsocket/statemachine/PublisherBase.h"

#include <glog/logging.h>

namespace rsocket {

PublisherBase::PublisherBase(uint32_t initialRequestN)
    : initialRequestN_(initialRequestN) {}

void PublisherBase::publisherSubscribe(
    std::shared_ptr<yarpl::flowable::Subscription> subscription) {
  if (state_ == State::CLOSED) {
    subscription->cancel();
    return;
  }
  DCHECK(!producingSubscription_);
  producingSubscription_ = std::move(subscription);
  if (initialRequestN_) {
    producingSubscription_->request(initialRequestN_.consumeAll());
  }
}

void PublisherBase::publisherComplete() {
  state_ = State::CLOSED;
  producingSubscription_ = nullptr;
}

bool PublisherBase::publisherClosed() const {
  return state_ == State::CLOSED;
}

void PublisherBase::processRequestN(uint32_t requestN) {
  if (requestN == 0 || state_ == State::CLOSED) {
    return;
  }

  // We might not have the subscription set yet as there can be REQUEST_N frames
  // scheduled on the executor before onSubscribe method.
  if (producingSubscription_) {
    producingSubscription_->request(requestN);
  } else {
    initialRequestN_.add(requestN);
  }
}

void PublisherBase::terminatePublisher() {
  state_ = State::CLOSED;
  if (auto subscription = std::move(producingSubscription_)) {
    subscription->cancel();
  }
}

} // namespace rsocket
