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

#include "yarpl/observable/ObservableOperator.h"

namespace yarpl {
namespace observable {
namespace details {

template <typename T>
class ConcatWithOperator : public ObservableOperator<T, T> {
  using Super = ObservableOperator<T, T>;

 public:
  ConcatWithOperator(
      std::shared_ptr<Observable<T>> first,
      std::shared_ptr<Observable<T>> second)
      : first_(std::move(first)), second_(std::move(second)) {
    CHECK(first_);
    CHECK(second_);
  }

  std::shared_ptr<Subscription> subscribe(
      std::shared_ptr<Observer<T>> observer) override {
    auto subscription =
        std::make_shared<ConcatWithSubscription>(observer, first_, second_);
    subscription->init();

    return subscription;
  }

 private:
  class ForwardObserver;

  // Downstream will always point to this subscription
  class ConcatWithSubscription
      : public yarpl::observable::Subscription,
        public std::enable_shared_from_this<ConcatWithSubscription> {
   public:
    ConcatWithSubscription(
        std::shared_ptr<Observer<T>> observer,
        std::shared_ptr<Observable<T>> first,
        std::shared_ptr<Observable<T>> second)
        : downObserver_(std::move(observer)),
          first_(std::move(first)),
          second_(std::move(second)) {}

    void init() {
      upObserver_ = std::make_shared<ForwardObserver>(this->shared_from_this());
      downObserver_->onSubscribe(this->shared_from_this());
      if (upObserver_) {
        first_->subscribe(upObserver_);
      }
    }

    void cancel() override {
      if (auto observer = std::move(upObserver_)) {
        observer->cancel();
      }
      first_.reset();
      second_.reset();
      upObserver_.reset();
      downObserver_.reset();
    }

    void onNext(T value) {
      downObserver_->onNext(std::move(value));
    }

    void onComplete() {
      if (auto first = std::move(first_)) {
        upObserver_ =
            std::make_shared<ForwardObserver>(this->shared_from_this());
        second_->subscribe(upObserver_);
        second_.reset();
      } else {
        downObserver_->onComplete();
        downObserver_.reset();
      }
    }

    void onError(folly::exception_wrapper ew) {
      downObserver_->onError(std::move(ew));
      first_.reset();
      second_.reset();
      upObserver_.reset();
      downObserver_.reset();
    }

   private:
    std::shared_ptr<Observer<T>> downObserver_;
    std::shared_ptr<Observable<T>> first_;
    std::shared_ptr<Observable<T>> second_;
    std::shared_ptr<ForwardObserver> upObserver_;
  };

  class ForwardObserver : public yarpl::observable::Observer<T>,
                          public yarpl::observable::Subscription {
   public:
    ForwardObserver(
        std::shared_ptr<ConcatWithSubscription> concatWithSubscription)
        : concatWithSubscription_(std::move(concatWithSubscription)) {}

    void cancel() override {
      if (auto subs = std::move(subscription_)) {
        subs->cancel();
      }
    }

    void onSubscribe(std::shared_ptr<Subscription> subscription) override {
      // Don't forward the subscription to downstream observer
      subscription_ = std::move(subscription);
    }

    void onComplete() override {
      concatWithSubscription_->onComplete();
      concatWithSubscription_.reset();
    }

    void onError(folly::exception_wrapper ew) override {
      concatWithSubscription_->onError(std::move(ew));
      concatWithSubscription_.reset();
    }

    void onNext(T value) override {
      concatWithSubscription_->onNext(std::move(value));
    }

   private:
    std::shared_ptr<ConcatWithSubscription> concatWithSubscription_;
    std::shared_ptr<observable::Subscription> subscription_;
  };

 private:
  const std::shared_ptr<Observable<T>> first_;
  const std::shared_ptr<Observable<T>> second_;
};

} // namespace details
} // namespace observable
} // namespace yarpl
