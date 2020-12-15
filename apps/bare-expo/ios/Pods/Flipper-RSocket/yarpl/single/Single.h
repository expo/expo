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

#include <folly/functional/Invoke.h>
#include <folly/synchronization/Baton.h>

#include "yarpl/Refcounted.h"
#include "yarpl/single/SingleObserver.h"
#include "yarpl/single/SingleObservers.h"
#include "yarpl/single/SingleSubscription.h"

namespace yarpl {
namespace single {

template <typename T>
class Single : public yarpl::enable_get_ref {
 public:
  virtual ~Single() = default;

  virtual void subscribe(std::shared_ptr<SingleObserver<T>>) = 0;

  /**
   * Subscribe overload that accepts lambdas.
   */
  template <
      typename Success,
      typename = typename std::enable_if<
          folly::is_invocable<std::decay_t<Success>&, T>::value>::type>
  void subscribe(Success&& next) {
    subscribe(SingleObservers::create<T>(std::forward<Success>(next)));
  }

  /**
   * Subscribe overload that accepts lambdas.
   */
  template <
      typename Success,
      typename Error,
      typename = typename std::enable_if<
          folly::is_invocable<std::decay_t<Success>&, T>::value &&
          folly::is_invocable<std::decay_t<Error>&, folly::exception_wrapper>::
              value>::type>
  void subscribe(Success next, Error error) {
    subscribe(SingleObservers::create<T>(
        std::forward<Success>(next), std::forward<Error>(error)));
  }

  /**
   * Blocking subscribe that accepts lambdas.
   *
   * This blocks the current thread waiting on the response.
   */
  template <
      typename Success,
      typename = typename std::enable_if<
          folly::is_invocable<std::decay_t<Success>&, T>::value>::type>
  void subscribeBlocking(Success&& next) {
    auto waiting_ = std::make_shared<folly::Baton<>>();
    subscribe(
        SingleObservers::create<T>([next = std::forward(next), waiting_](T t) {
          next(std::move(t));
          waiting_->post();
        }));
    // TODO get errors and throw if one is received
    waiting_->wait();
  }

  template <
      typename OnSubscribe,
      typename = typename std::enable_if<folly::is_invocable<
          std::decay_t<OnSubscribe>&,
          std::shared_ptr<SingleObserver<T>>>::value>::type>
  static std::shared_ptr<Single<T>> create(OnSubscribe&&);

  template <typename Function>
  auto map(Function&& function);
};

template <>
class Single<void> {
 public:
  virtual ~Single() = default;

  virtual void subscribe(std::shared_ptr<SingleObserverBase<void>>) = 0;

  /**
   * Subscribe overload taking lambda for onSuccess that is called upon writing
   * to the network.
   */
  template <
      typename Success,
      typename = typename std::enable_if<
          folly::is_invocable<std::decay_t<Success>&>::value>::type>
  void subscribe(Success&& s) {
    class SuccessSingleObserver : public SingleObserverBase<void> {
     public:
      explicit SuccessSingleObserver(Success&& success)
          : success_{std::forward<Success>(success)} {}

      void onSubscribe(
          std::shared_ptr<SingleSubscription> subscription) override {
        SingleObserverBase<void>::onSubscribe(std::move(subscription));
      }

      void onSuccess() override {
        success_();
        SingleObserverBase<void>::onSuccess();
      }

      // No further calls to the subscription after this method is invoked.
      void onError(folly::exception_wrapper ex) override {
        SingleObserverBase<void>::onError(std::move(ex));
      }

     private:
      std::decay_t<Success> success_;
    };

    subscribe(
        std::make_shared<SuccessSingleObserver>(std::forward<Success>(s)));
  }

  template <
      typename OnSubscribe,
      typename = typename std::enable_if<folly::is_invocable<
          std::decay_t<OnSubscribe>&,
          std::shared_ptr<SingleObserverBase<void>>>::value>::type>
  static auto create(OnSubscribe&&);
};

} // namespace single
} // namespace yarpl

#include "yarpl/single/SingleOperator.h"

namespace yarpl {
namespace single {

template <typename T>
template <typename OnSubscribe, typename>
std::shared_ptr<Single<T>> Single<T>::create(OnSubscribe&& function) {
  return std::make_shared<FromPublisherOperator<T, std::decay_t<OnSubscribe>>>(
      std::forward<OnSubscribe>(function));
}

template <typename OnSubscribe, typename>
auto Single<void>::create(OnSubscribe&& function) {
  return std::make_shared<
      SingleVoidFromPublisherOperator<std::decay_t<OnSubscribe>>>(
      std::forward<OnSubscribe>(function));
}

template <typename T>
template <typename Function>
auto Single<T>::map(Function&& function) {
  using D = typename folly::invoke_result_t<Function, T>;
  return std::make_shared<MapOperator<T, D, std::decay_t<Function>>>(
      this->ref_from_this(this), std::forward<Function>(function));
}

} // namespace single
} // namespace yarpl
