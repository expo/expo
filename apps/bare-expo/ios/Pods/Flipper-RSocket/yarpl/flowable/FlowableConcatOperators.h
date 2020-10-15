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

#include "yarpl/flowable/FlowableOperator.h"

namespace yarpl {
namespace flowable {
namespace details {

template <typename T>
class ConcatWithOperator : public FlowableOperator<T, T> {
  using Super = FlowableOperator<T, T>;

 public:
  ConcatWithOperator(
      std::shared_ptr<Flowable<T>> first,
      std::shared_ptr<Flowable<T>> second)
      : first_(std::move(first)), second_(std::move(second)) {
    CHECK(first_);
    CHECK(second_);
  }

  void subscribe(std::shared_ptr<Subscriber<T>> subscriber) override {
    auto subscription =
        std::make_shared<ConcatWithSubscription>(subscriber, first_, second_);
    subscription->init();
  }

 private:
  class ForwardSubscriber;

  // Downstream will always point to this subscription
  class ConcatWithSubscription
      : public yarpl::flowable::Subscription,
        public std::enable_shared_from_this<ConcatWithSubscription> {
   public:
    ConcatWithSubscription(
        std::shared_ptr<Subscriber<T>> subscriber,
        std::shared_ptr<Flowable<T>> first,
        std::shared_ptr<Flowable<T>> second)
        : downSubscriber_(std::move(subscriber)),
          first_(std::move(first)),
          second_(std::move(second)) {}

    void init() {
      upSubscriber_ =
          std::make_shared<ForwardSubscriber>(this->shared_from_this());
      first_->subscribe(upSubscriber_);
      downSubscriber_->onSubscribe(this->shared_from_this());
    }

    void request(int64_t n) override {
      credits::add(&requested_, n);
      if (!upSubscriber_) {
        if (auto second = std::exchange(second_, nullptr)) {
          upSubscriber_ = std::make_shared<ForwardSubscriber>(
              this->shared_from_this(), requested_);
          second->subscribe(upSubscriber_);
        }
      } else {
        upSubscriber_->request(n);
      }
    }

    void cancel() override {
      if (auto subscriber = std::move(upSubscriber_)) {
        subscriber->cancel();
      }
      first_.reset();
      second_.reset();
      downSubscriber_.reset();
      upSubscriber_.reset();
    }

    void onNext(T value) {
      credits::consume(&requested_, 1);
      downSubscriber_->onNext(std::move(value));
    }

    void onComplete() {
      upSubscriber_.reset();
      if (auto first = std::move(first_)) {
        if (requested_ > 0) {
          if (auto second = std::exchange(second_, nullptr)) {
            upSubscriber_ = std::make_shared<ForwardSubscriber>(
                this->shared_from_this(), requested_);
            // TODO - T28771728
            // Concat should not call 'subscribe' on onComplete
            second->subscribe(upSubscriber_);
          }
        }
      } else {
        if (auto downSubscriber = std::exchange(downSubscriber_, nullptr)) {
          downSubscriber->onComplete();
        }
        upSubscriber_.reset();
      }
    }

    void onError(folly::exception_wrapper ew) {
      downSubscriber_->onError(std::move(ew));
      first_.reset();
      second_.reset();
      downSubscriber_.reset();
      upSubscriber_.reset();
    }

   private:
    std::shared_ptr<Subscriber<T>> downSubscriber_;
    std::shared_ptr<Flowable<T>> first_;
    std::shared_ptr<Flowable<T>> second_;
    std::shared_ptr<ForwardSubscriber> upSubscriber_;
    std::atomic<int64_t> requested_{0};
  };

  class ForwardSubscriber : public yarpl::flowable::Subscriber<T>,
                            public yarpl::flowable::Subscription {
   public:
    ForwardSubscriber(
        std::shared_ptr<ConcatWithSubscription> concatWithSubscription,
        uint32_t initialRequest = 0u)
        : concatWithSubscription_(std::move(concatWithSubscription)),
          initialRequest_(initialRequest) {}

    void request(int64_t n) override {
      subscription_->request(n);
    }

    void cancel() override {
      if (auto subs = std::move(subscription_)) {
        subs->cancel();
      } else {
        canceled_ = true;
      }
    }

    void onSubscribe(std::shared_ptr<Subscription> subscription) override {
      if (canceled_) {
        subscription->cancel();
        return;
      }
      subscription_ = std::move(subscription);
      if (auto req = std::exchange(initialRequest_, 0)) {
        subscription_->request(req);
      }
    }

    void onComplete() override {
      auto sub = std::exchange(concatWithSubscription_, nullptr);
      sub->onComplete();
    }

    void onError(folly::exception_wrapper ew) override {
      auto sub = std::exchange(concatWithSubscription_, nullptr);
      sub->onError(std::move(ew));
    }
    void onNext(T value) override {
      concatWithSubscription_->onNext(std::move(value));
    }

   private:
    std::shared_ptr<ConcatWithSubscription> concatWithSubscription_;
    std::shared_ptr<flowable::Subscription> subscription_;

    uint32_t initialRequest_{0};
    bool canceled_{false};
  };

 private:
  const std::shared_ptr<Flowable<T>> first_;
  const std::shared_ptr<Flowable<T>> second_;
};

} // namespace details
} // namespace flowable
} // namespace yarpl
