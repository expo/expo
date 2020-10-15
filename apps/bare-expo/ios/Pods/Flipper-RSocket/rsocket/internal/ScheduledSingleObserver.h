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

#include "rsocket/internal/ScheduledSingleSubscription.h"
#include "yarpl/single/SingleObserver.h"
#include "yarpl/single/Singles.h"

namespace rsocket {

//
// A decorated RSocketResponder object which schedules the calls from
// application code to RSocket on the provided EventBase
// This class should be used to wrap a SingleObserver returned to the
// application code so that calls to on{Subscribe,Success,Error} are
// scheduled on the right EventBase.
//
template <typename T>
class ScheduledSingleObserver : public yarpl::single::SingleObserver<T> {
 public:
  ScheduledSingleObserver(
      std::shared_ptr<yarpl::single::SingleObserver<T>> observer,
      folly::EventBase& eventBase)
      : inner_(std::move(observer)), eventBase_(eventBase) {}

  void onSubscribe(std::shared_ptr<yarpl::single::SingleSubscription>
                       subscription) override {
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
  void onSuccess(T value) override {
    if (eventBase_.isInEventBaseThread()) {
      inner_->onSuccess(std::move(value));
    } else {
      eventBase_.runInEventBaseThread(
          [inner = inner_, value = std::move(value)]() mutable {
            inner->onSuccess(std::move(value));
          });
    }
  }

  // No further calls to the subscription after this method is invoked.
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

 private:
  const std::shared_ptr<yarpl::single::SingleObserver<T>> inner_;
  folly::EventBase& eventBase_;
};

//
// This class should be used to wrap a SingleObserver provided from the
// application code to the library. The library's Subscriber provided to the
// application code will be wrapped with a scheduled subscription to make the
// call to Subscription::cancel safe.
//
template <typename T>
class ScheduledSubscriptionSingleObserver
    : public yarpl::single::SingleObserver<T> {
 public:
  ScheduledSubscriptionSingleObserver(
      std::shared_ptr<yarpl::single::SingleObserver<T>> observer,
      folly::EventBase& eventBase)
      : inner_(std::move(observer)), eventBase_(eventBase) {}

  void onSubscribe(std::shared_ptr<yarpl::single::SingleSubscription>
                       subscription) override {
    inner_->onSubscribe(std::make_shared<ScheduledSingleSubscription>(
        std::move(subscription), eventBase_));
  }

  // No further calls to the subscription after this method is invoked.
  void onSuccess(T value) override {
    inner_->onSuccess(std::move(value));
  }

  // No further calls to the subscription after this method is invoked.
  void onError(folly::exception_wrapper ex) override {
    inner_->onError(std::move(ex));
  }

 private:
  const std::shared_ptr<yarpl::single::SingleObserver<T>> inner_;
  folly::EventBase& eventBase_;
};
} // namespace rsocket
