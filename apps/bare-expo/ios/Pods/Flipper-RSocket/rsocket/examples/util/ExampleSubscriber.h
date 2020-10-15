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

#include <folly/ExceptionWrapper.h>
#include <condition_variable>
#include <mutex>
#include "rsocket/Payload.h"

#include "yarpl/Flowable.h"
#include "yarpl/flowable/Subscriber.h"

/**
 * Subscriber that logs all events.
 * Request 5 items to begin with, then 3 more after each receipt of 3.
 */
namespace rsocket_example {
class ExampleSubscriber : public yarpl::flowable::Subscriber<rsocket::Payload> {
 public:
  ~ExampleSubscriber();
  ExampleSubscriber(int initialRequest, int numToTake);

  void onSubscribe(std::shared_ptr<yarpl::flowable::Subscription>
                       subscription) noexcept override;
  void onNext(rsocket::Payload) noexcept override;
  void onComplete() noexcept override;
  void onError(folly::exception_wrapper ex) noexcept override;

  void awaitTerminalEvent();

 private:
  int initialRequest_;
  int thresholdForRequest_;
  int numToTake_;
  int requested_;
  int received_;
  std::shared_ptr<yarpl::flowable::Subscription> subscription_;
  bool terminated_{false};
  std::mutex m_;
  std::condition_variable terminalEventCV_;
};
} // namespace rsocket_example
