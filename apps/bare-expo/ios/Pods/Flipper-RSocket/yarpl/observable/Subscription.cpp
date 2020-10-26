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

#include "yarpl/observable/Subscription.h"
#include <glog/logging.h>
#include <atomic>
#include <iostream>

namespace yarpl {
namespace observable {

/**
 * Implementation that allows checking if a Subscription is cancelled.
 */
void Subscription::cancel() {
  cancelled_ = true;
  // Lock must be obtained here and not in the range expression for it to
  // apply to the loop body.
  auto locked = tiedSubscriptions_.wlock();
  for (auto& subscription : *locked) {
    subscription->cancel();
  }
}

bool Subscription::isCancelled() const {
  return cancelled_;
}

void Subscription::tieSubscription(std::shared_ptr<Subscription> subscription) {
  CHECK(subscription);
  if (isCancelled()) {
    subscription->cancel();
  }
  tiedSubscriptions_.wlock()->push_back(std::move(subscription));
}

std::shared_ptr<Subscription> Subscription::create(
    std::function<void()> onCancel) {
  class CallbackSubscription : public Subscription {
   public:
    explicit CallbackSubscription(std::function<void()> onCancel)
        : onCancel_(std::move(onCancel)) {}

    void cancel() override {
      bool expected = false;
      // mark cancelled 'true' and only if successful invoke 'onCancel()'
      if (cancelled_.compare_exchange_strong(expected, true)) {
        onCancel_();
        // Lock must be obtained here and not in the range expression for it to
        // apply to the loop body.
        auto locked = tiedSubscriptions_.wlock();
        for (auto& subscription : *locked) {
          subscription->cancel();
        }
      }
    }

   private:
    std::function<void()> onCancel_;
  };
  return std::make_shared<CallbackSubscription>(std::move(onCancel));
}

std::shared_ptr<Subscription> Subscription::create(
    std::atomic_bool& cancelled) {
  return create([&cancelled]() { cancelled = true; });
}

std::shared_ptr<Subscription> Subscription::create() {
  return std::make_shared<Subscription>();
}

} // namespace observable
} // namespace yarpl
