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

#include "rsocket/internal/ScheduledSubscription.h"

#include <folly/io/async/EventBase.h>

#include "yarpl/flowable/Subscriber.h"

namespace rsocket {

//
// A decorator of the Subscriber object which schedules the method calls on the
// provided EventBase.
// This class should be used to wrap a Subscriber returned to the application
// code so that calls to on{Subscribe,Next,Complete,Error} are scheduled on the
// right EventBase.
//

template <typename T>
class ScheduledSubscriber : public yarpl::flowable::Subscriber<T> {
 public:
  ScheduledSubscriber(
      std::shared_ptr<yarpl::flowable::Subscriber<T>> inner,
      folly::EventBase& eventBase)
      : inner_(std::move(inner)), eventBase_(eventBase) {}

  void onSubscribe(
      std::shared_ptr<yarpl::flowable::Subscription> subscription) override {
    if (eventBase_.isInEventBaseThread()) {
      inner_->onSubscribe(std::move(subscription));
    } else {
      eventBase_.runInEventBaseThread(
          [inner = inner_, subscription = std::move(subscription)] {
            inner->onSubscribe(std::move(subscription));
          });
    }
  }

  // No further calls to the subscription after this method is invoked.
  void onComplete() override {
    if (eventBase_.isInEventBaseThread()) {
      inner_->onComplete();
    } else {
      eventBase_.runInEventBaseThread(
          [inner = inner_] { inner->onComplete(); });
    }
  }

  void onError(folly::exception_wrapper ex) override {
    if (eventBase_.isInEventBaseThread()) {
      inner_->onError(std::move(ex));
    } else {
      eventBase_.runInEventBaseThread(
          [inner = inner_, ex = std::move(ex)]() mutable {
            inner->onError(std::move(ex));
          });
    }
  }

  void onNext(T value) override {
    if (eventBase_.isInEventBaseThread()) {
      inner_->onNext(std::move(value));
    } else {
      eventBase_.runInEventBaseThread(
          [inner = inner_, value = std::move(value)]() mutable {
            inner->onNext(std::move(value));
          });
    }
  }

 private:
  const std::shared_ptr<yarpl::flowable::Subscriber<T>> inner_;
  folly::EventBase& eventBase_;
};

//
// A decorator of a Subscriber object which schedules the method calls on the
// provided EventBase.
// This class is to wrap the Subscriber provided from the application code to
// the library. The Subscription passed to onSubscribe method needs to be
// wrapped in the ScheduledSubscription since the application code calls
// request and cancel from any thread.
//
template <typename T>
class ScheduledSubscriptionSubscriber : public yarpl::flowable::Subscriber<T> {
 public:
  ScheduledSubscriptionSubscriber(
      std::shared_ptr<yarpl::flowable::Subscriber<T>> inner,
      folly::EventBase& eventBase)
      : inner_(std::move(inner)), eventBase_(eventBase) {}

  void onSubscribe(
      std::shared_ptr<yarpl::flowable::Subscription> sub) override {
    auto scheduled =
        std::make_shared<ScheduledSubscription>(std::move(sub), eventBase_);
    inner_->onSubscribe(std::move(scheduled));
  }

  void onNext(T value) override {
    inner_->onNext(std::move(value));
  }

  void onComplete() override {
    auto inner = std::move(inner_);
    inner->onComplete();
  }

  void onError(folly::exception_wrapper ew) override {
    auto inner = std::move(inner_);
    inner->onError(std::move(ew));
  }

 private:
  std::shared_ptr<yarpl::flowable::Subscriber<T>> inner_;
  folly::EventBase& eventBase_;
};

} // namespace rsocket
