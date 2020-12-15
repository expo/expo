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

template <
    typename U,
    typename OnSubscribeFunc,
    typename OnNextFunc,
    typename OnErrorFunc,
    typename OnCompleteFunc,
    typename OnCancelFunc>
class DoOperator : public ObservableOperator<U, U> {
  using Super = ObservableOperator<U, U>;
  static_assert(
      std::is_same<std::decay_t<OnSubscribeFunc>, OnSubscribeFunc>::value,
      "undecayed");
  static_assert(
      std::is_same<std::decay_t<OnNextFunc>, OnNextFunc>::value,
      "undecayed");
  static_assert(
      std::is_same<std::decay_t<OnErrorFunc>, OnErrorFunc>::value,
      "undecayed");
  static_assert(
      std::is_same<std::decay_t<OnCompleteFunc>, OnCompleteFunc>::value,
      "undecayed");
  static_assert(
      std::is_same<std::decay_t<OnCancelFunc>, OnCancelFunc>::value,
      "undecayed");

 public:
  template <
      typename FSubscribe,
      typename FNext,
      typename FError,
      typename FComplete,
      typename FCancel>
  DoOperator(
      std::shared_ptr<Observable<U>> upstream,
      FSubscribe&& onSubscribeFunc,
      FNext&& onNextFunc,
      FError&& onErrorFunc,
      FComplete&& onCompleteFunc,
      FCancel&& onCancelFunc)
      : upstream_(std::move(upstream)),
        onSubscribeFunc_(std::forward<FSubscribe>(onSubscribeFunc)),
        onNextFunc_(std::forward<FNext>(onNextFunc)),
        onErrorFunc_(std::forward<FError>(onErrorFunc)),
        onCompleteFunc_(std::forward<FComplete>(onCompleteFunc)),
        onCancelFunc_(std::forward<FCancel>(onCancelFunc)) {}

  std::shared_ptr<Subscription> subscribe(
      std::shared_ptr<Observer<U>> observer) override {
    auto subscription = std::make_shared<DoSubscription>(
        this->ref_from_this(this), std::move(observer));
    upstream_->subscribe(
        // Note: implicit cast to a reference to a observer.
        subscription);
    return subscription;
  }

 private:
  class DoSubscription : public Super::OperatorSubscription {
    using SuperSub = typename Super::OperatorSubscription;

   public:
    DoSubscription(
        std::shared_ptr<DoOperator> observable,
        std::shared_ptr<Observer<U>> observer)
        : SuperSub(std::move(observer)), observable_(std::move(observable)) {}

    void onSubscribe(std::shared_ptr<yarpl::observable::Subscription>
                         subscription) override {
      observable_->onSubscribeFunc_();
      SuperSub::onSubscribe(std::move(subscription));
    }

    void onNext(U value) override {
      const auto& valueRef = value;
      observable_->onNextFunc_(valueRef);
      SuperSub::observerOnNext(std::move(value));
    }

    void onError(folly::exception_wrapper ex) override {
      const auto& exRef = ex;
      observable_->onErrorFunc_(exRef);
      SuperSub::onError(std::move(ex));
    }

    void onComplete() override {
      observable_->onCompleteFunc_();
      SuperSub::onComplete();
    }

    void cancel() override {
      observable_->onCancelFunc_();
      SuperSub::cancel();
    }

   private:
    std::shared_ptr<DoOperator> observable_;
  };

  std::shared_ptr<Observable<U>> upstream_;
  OnSubscribeFunc onSubscribeFunc_;
  OnNextFunc onNextFunc_;
  OnErrorFunc onErrorFunc_;
  OnCompleteFunc onCompleteFunc_;
  OnCancelFunc onCancelFunc_;
};

template <
    typename U,
    typename OnSubscribeFunc,
    typename OnNextFunc,
    typename OnErrorFunc,
    typename OnCompleteFunc,
    typename OnCancelFunc>
inline auto createDoOperator(
    std::shared_ptr<Observable<U>> upstream,
    OnSubscribeFunc&& onSubscribeFunc,
    OnNextFunc&& onNextFunc,
    OnErrorFunc&& onErrorFunc,
    OnCompleteFunc&& onCompleteFunc,
    OnCancelFunc&& onCancelFunc) {
  return std::make_shared<DoOperator<
      U,
      std::decay_t<OnSubscribeFunc>,
      std::decay_t<OnNextFunc>,
      std::decay_t<OnErrorFunc>,
      std::decay_t<OnCompleteFunc>,
      std::decay_t<OnCancelFunc>>>(
      std::move(upstream),
      std::forward<OnSubscribeFunc>(onSubscribeFunc),
      std::forward<OnNextFunc>(onNextFunc),
      std::forward<OnErrorFunc>(onErrorFunc),
      std::forward<OnCompleteFunc>(onCompleteFunc),
      std::forward<OnCancelFunc>(onCancelFunc));
}
} // namespace details
} // namespace observable
} // namespace yarpl
