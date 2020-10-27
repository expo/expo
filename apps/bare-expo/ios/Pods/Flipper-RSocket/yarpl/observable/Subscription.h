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

#include <folly/Synchronized.h>
#include <vector>

namespace yarpl {
namespace observable {

class Subscription {
 public:
  virtual ~Subscription() = default;
  virtual void cancel();
  bool isCancelled() const;

  // Adds ability to tie another subscription to this instance.
  // Whenever *this subscription is cancelled then all tied subscriptions get
  // cancelled as well
  void tieSubscription(std::shared_ptr<Subscription> subscription);

  static std::shared_ptr<Subscription> create(std::function<void()> onCancel);
  static std::shared_ptr<Subscription> create(std::atomic_bool& cancelled);
  static std::shared_ptr<Subscription> create();

 protected:
  std::atomic<bool> cancelled_{false};
  folly::Synchronized<std::vector<std::shared_ptr<Subscription>>>
      tiedSubscriptions_;
};

} // namespace observable
} // namespace yarpl
