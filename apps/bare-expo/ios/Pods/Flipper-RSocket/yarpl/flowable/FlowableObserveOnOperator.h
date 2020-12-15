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

#include "yarpl/flowable/Flowable.h"

namespace yarpl {
namespace flowable {
namespace detail {

template <typename T>
class ObserveOnOperatorSubscriber;

template <typename T>
class ObserveOnOperatorSubscription : public yarpl::flowable::Subscription,
                                      public yarpl::enable_get_ref {
 public:
  ObserveOnOperatorSubscription(
      std::shared_ptr<ObserveOnOperatorSubscriber<T>> subscriber,
      std::shared_ptr<Subscription> subscription)
      : subscriber_(std::move(subscriber)),
        subscription_(std::move(subscription)) {}

  // all requesting methods are called from 'executor_' in the
  // associated subscriber
  void cancel() override {
    auto self = this->ref_from_this(this);

    if (auto subscriber = std::move(subscriber_)) {
      subscriber->inner_ = nullptr;
    }

    subscription_->cancel();
  }

  void request(int64_t n) override {
    subscription_->request(n);
  }

 private:
  std::shared_ptr<ObserveOnOperatorSubscriber<T>> subscriber_;
  std::shared_ptr<Subscription> subscription_;
};

template <typename T>
class ObserveOnOperatorSubscriber : public yarpl::flowable::Subscriber<T>,
                                    public yarpl::enable_get_ref {
 public:
  ObserveOnOperatorSubscriber(
      std::shared_ptr<Subscriber<T>> inner,
      folly::Executor::KeepAlive<> executor)
      : inner_(std::move(inner)), executor_(std::move(executor)) {}

  // all signaling methods are called from upstream EB
  void onSubscribe(std::shared_ptr<Subscription> subscription) override {
    executor_->add([self = this->ref_from_this(this),
                    s = std::move(subscription)]() mutable {
      auto sub = std::make_shared<ObserveOnOperatorSubscription<T>>(
          self, std::move(s));
      self->inner_->onSubscribe(std::move(sub));
    });
  }
  void onNext(T next) override {
    executor_->add(
        [self = this->ref_from_this(this), n = std::move(next)]() mutable {
          if (auto& inner = self->inner_) {
            inner->onNext(std::move(n));
          }
        });
  }
  void onComplete() override {
    executor_->add([self = this->ref_from_this(this)]() mutable {
      if (auto inner = std::exchange(self->inner_, nullptr)) {
        inner->onComplete();
      }
    });
  }
  void onError(folly::exception_wrapper err) override {
    executor_->add(
        [self = this->ref_from_this(this), e = std::move(err)]() mutable {
          if (auto inner = std::exchange(self->inner_, nullptr)) {
            inner->onError(std::move(e));
          }
        });
  }

 private:
  friend class ObserveOnOperatorSubscription<T>;

  std::shared_ptr<Subscriber<T>> inner_;
  folly::Executor::KeepAlive<> executor_;
};

template <typename T>
class ObserveOnOperator : public yarpl::flowable::Flowable<T> {
 public:
  ObserveOnOperator(
      std::shared_ptr<Flowable<T>> upstream,
      folly::Executor::KeepAlive<> executor)
      : upstream_(std::move(upstream)), executor_(std::move(executor)) {}

  void subscribe(std::shared_ptr<Subscriber<T>> subscriber) override {
    upstream_->subscribe(std::make_shared<ObserveOnOperatorSubscriber<T>>(
        std::move(subscriber), folly::getKeepAliveToken(executor_.get())));
  }

  std::shared_ptr<Flowable<T>> upstream_;
  folly::Executor::KeepAlive<> executor_;
};
} // namespace detail
} // namespace flowable
} // namespace yarpl
