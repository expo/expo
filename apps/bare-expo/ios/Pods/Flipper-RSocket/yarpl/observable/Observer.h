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
#include <folly/functional/Invoke.h>
#include <glog/logging.h>
#include "yarpl/Refcounted.h"
#include "yarpl/observable/Subscription.h"

namespace yarpl {
namespace observable {

template <typename T>
class Observer : public yarpl::enable_get_ref {
 public:
  // Note: If any of the following methods is overridden in a subclass, the new
  // methods SHOULD ensure that these are invoked as well.
  virtual void onSubscribe(std::shared_ptr<Subscription> subscription) {
    DCHECK(subscription);

    if (subscription_) {
      DLOG(ERROR) << "attempt to double subscribe";
      subscription->cancel();
      return;
    }

    if (cancelled_) {
      subscription->cancel();
    }

    subscription_ = std::move(subscription);
  }

  // No further calls to the subscription after this method is invoked.
  virtual void onComplete() {
    DCHECK(subscription_) << "Calling onComplete() without a subscription";
    subscription_.reset();
  }

  // No further calls to the subscription after this method is invoked.
  virtual void onError(folly::exception_wrapper) {
    DCHECK(subscription_) << "Calling onError() without a subscription";
    subscription_.reset();
  }

  virtual void onNext(T) = 0;

  bool isUnsubscribed() const {
    CHECK(subscription_);
    return subscription_->isCancelled();
  }

  // Ability to add more subscription objects which will be notified when the
  // subscription has been cancelled.
  // Note that calling cancel on the tied subscription is not going to cancel
  // this subscriber
  void addSubscription(std::shared_ptr<Subscription> subscription) {
    if (!subscription_) {
      subscription->cancel();
      return;
    }
    subscription_->tieSubscription(std::move(subscription));
  }

  template <typename OnCancel>
  void addSubscription(OnCancel onCancel) {
    addSubscription(Subscription::create(std::move(onCancel)));
  }

  bool isUnsubscribedOrTerminated() const {
    return !subscription_ || subscription_->isCancelled();
  }

 protected:
  void unsubscribe() {
    if (subscription_) {
      subscription_->cancel();
    } else {
      cancelled_ = true;
    }
  }

 public:
  template <
      typename Next,
      typename =
          typename std::enable_if<folly::is_invocable<Next, T>::value>::type>
  static std::shared_ptr<Observer<T>> create(Next next);

  template <
      typename Next,
      typename Error,
      typename =
          typename std::enable_if<folly::is_invocable<Next, T>::value>::type,
      typename = typename std::enable_if<
          folly::is_invocable<Error, folly::exception_wrapper>::value>::type>
  static std::shared_ptr<Observer<T>> create(Next next, Error error);

  template <
      typename Next,
      typename Error,
      typename Complete,
      typename =
          typename std::enable_if<folly::is_invocable<Next, T>::value>::type,
      typename = typename std::enable_if<
          folly::is_invocable<Error, folly::exception_wrapper>::value>::type,
      typename =
          typename std::enable_if<folly::is_invocable<Complete>::value>::type>
  static std::shared_ptr<Observer<T>>
  create(Next next, Error error, Complete complete);

  static std::shared_ptr<Observer<T>> create() {
    class NullObserver : public Observer<T> {
     public:
      void onNext(T) {}
    };
    return std::make_shared<NullObserver>();
  }

 private:
  std::shared_ptr<Subscription> subscription_;
  bool cancelled_{false};
};

namespace details {

template <typename T, typename Next>
class Base : public Observer<T> {
  static_assert(std::is_same<std::decay_t<Next>, Next>::value, "undecayed");

 public:
  template <typename FNext>
  explicit Base(FNext&& next) : next_(std::forward<FNext>(next)) {}

  void onNext(T value) override {
    next_(std::move(value));
  }

 private:
  Next next_;
};

template <typename T, typename Next, typename Error>
class WithError : public Base<T, Next> {
  static_assert(std::is_same<std::decay_t<Error>, Error>::value, "undecayed");

 public:
  template <typename FNext, typename FError>
  WithError(FNext&& next, FError&& error)
      : Base<T, Next>(std::forward<FNext>(next)),
        error_(std::forward<FError>(error)) {}

  void onError(folly::exception_wrapper error) override {
    error_(std::move(error));
  }

 private:
  Error error_;
};

template <typename T, typename Next, typename Error, typename Complete>
class WithErrorAndComplete : public WithError<T, Next, Error> {
  static_assert(
      std::is_same<std::decay_t<Complete>, Complete>::value,
      "undecayed");

 public:
  template <typename FNext, typename FError, typename FComplete>
  WithErrorAndComplete(FNext&& next, FError&& error, FComplete&& complete)
      : WithError<T, Next, Error>(
            std::forward<FNext>(next),
            std::forward<FError>(error)),
        complete_(std::move(complete)) {}

  void onComplete() override {
    complete_();
  }

 private:
  Complete complete_;
};
} // namespace details

template <typename T>
template <typename Next, typename>
std::shared_ptr<Observer<T>> Observer<T>::create(Next next) {
  return std::make_shared<details::Base<T, Next>>(std::move(next));
}

template <typename T>
template <typename Next, typename Error, typename, typename>
std::shared_ptr<Observer<T>> Observer<T>::create(Next next, Error error) {
  return std::make_shared<details::WithError<T, Next, Error>>(
      std::move(next), std::move(error));
}

template <typename T>
template <
    typename Next,
    typename Error,
    typename Complete,
    typename,
    typename,
    typename>
std::shared_ptr<Observer<T>>
Observer<T>::create(Next next, Error error, Complete complete) {
  return std::make_shared<
      details::WithErrorAndComplete<T, Next, Error, Complete>>(
      std::move(next), std::move(error), std::move(complete));
}

} // namespace observable
} // namespace yarpl
