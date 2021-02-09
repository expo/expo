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

#include <boost/noncopyable.hpp>
#include <folly/ExceptionWrapper.h>
#include <folly/functional/Invoke.h>
#include <glog/logging.h>
#include "yarpl/Disposable.h"
#include "yarpl/Refcounted.h"
#include "yarpl/flowable/Subscription.h"
#include "yarpl/utils/credits.h"

namespace yarpl {
namespace flowable {

template <typename T>
class Subscriber : boost::noncopyable {
 public:
  virtual ~Subscriber() = default;
  virtual void onSubscribe(std::shared_ptr<Subscription>) = 0;
  virtual void onComplete() = 0;
  virtual void onError(folly::exception_wrapper) = 0;
  virtual void onNext(T) = 0;

  template <
      typename Next,
      typename = typename std::enable_if<
          folly::is_invocable<std::decay_t<Next>&, T>::value>::type>
  static std::shared_ptr<Subscriber<T>> create(
      Next&& next,
      int64_t batch = credits::kNoFlowControl);

  template <
      typename Next,
      typename Error,
      typename = typename std::enable_if<
          folly::is_invocable<std::decay_t<Next>&, T>::value &&
          folly::is_invocable<std::decay_t<Error>&, folly::exception_wrapper>::
              value>::type>
  static std::shared_ptr<Subscriber<T>>
  create(Next&& next, Error&& error, int64_t batch = credits::kNoFlowControl);

  template <
      typename Next,
      typename Error,
      typename Complete,
      typename = typename std::enable_if<
          folly::is_invocable<std::decay_t<Next>&, T>::value &&
          folly::is_invocable<std::decay_t<Error>&, folly::exception_wrapper>::
              value &&
          folly::is_invocable<std::decay_t<Complete>&>::value>::type>
  static std::shared_ptr<Subscriber<T>> create(
      Next&& next,
      Error&& error,
      Complete&& complete,
      int64_t batch = credits::kNoFlowControl);

  static std::shared_ptr<Subscriber<T>> create() {
    class NullSubscriber : public Subscriber<T> {
      void onSubscribe(std::shared_ptr<Subscription> s) override final {
        s->request(credits::kNoFlowControl);
      }

      void onNext(T) override final {}
      void onComplete() override {}
      void onError(folly::exception_wrapper) override {}
    };
    return std::make_shared<NullSubscriber>();
  }
};

namespace details {

template <typename T>
class BaseSubscriberDisposable;

} // namespace details

#define KEEP_REF_TO_THIS()              \
  std::shared_ptr<BaseSubscriber> self; \
  if (keep_reference_to_this) {         \
    self = this->ref_from_this(this);   \
  }

// T : Type of Flowable that this Subscriber operates on
//
// keep_reference_to_this : BaseSubscriber will keep a live reference to
// itself on the stack while in a signaling or requesting method, in case
// the derived class causes all other references to itself to be dropped.
//
// Classes that ensure that at least one reference will stay live can
// use `keep_reference_to_this = false` as an optimization to
// prevent an atomic inc/dec pair
template <typename T, bool keep_reference_to_this = true>
class BaseSubscriber : public Subscriber<T>, public yarpl::enable_get_ref {
 public:
  // Note: If any of the following methods is overridden in a subclass, the new
  // methods SHOULD ensure that these are invoked as well.
  void onSubscribe(std::shared_ptr<Subscription> subscription) final override {
    CHECK(subscription);
    CHECK(!yarpl::atomic_load(&subscription_));

#ifndef NDEBUG
    DCHECK(!gotOnSubscribe_.exchange(true))
        << "Already subscribed to BaseSubscriber";
#endif

    yarpl::atomic_store(&subscription_, std::move(subscription));
    KEEP_REF_TO_THIS();
    onSubscribeImpl();
  }

  // No further calls to the subscription after this method is invoked.
  void onComplete() final override {
#ifndef NDEBUG
    DCHECK(gotOnSubscribe_.load()) << "Not subscribed to BaseSubscriber";
    DCHECK(!gotTerminating_.exchange(true))
        << "Already got terminating signal method";
#endif

    std::shared_ptr<Subscription> null;
    if (auto sub = yarpl::atomic_exchange(&subscription_, null)) {
      KEEP_REF_TO_THIS();
      onCompleteImpl();
      onTerminateImpl();
    }
  }

  // No further calls to the subscription after this method is invoked.
  void onError(folly::exception_wrapper e) final override {
#ifndef NDEBUG
    DCHECK(gotOnSubscribe_.load()) << "Not subscribed to BaseSubscriber";
    DCHECK(!gotTerminating_.exchange(true))
        << "Already got terminating signal method";
#endif

    std::shared_ptr<Subscription> null;
    if (auto sub = yarpl::atomic_exchange(&subscription_, null)) {
      KEEP_REF_TO_THIS();
      onErrorImpl(std::move(e));
      onTerminateImpl();
    }
  }

  void onNext(T t) final override {
#ifndef NDEBUG
    DCHECK(gotOnSubscribe_.load()) << "Not subscibed to BaseSubscriber";
    if (gotTerminating_.load()) {
      VLOG(2) << "BaseSubscriber already got terminating signal method";
    }
#endif

    if (auto sub = yarpl::atomic_load(&subscription_)) {
      KEEP_REF_TO_THIS();
      onNextImpl(std::move(t));
    }
  }

  void cancel() {
    std::shared_ptr<Subscription> null;
    if (auto sub = yarpl::atomic_exchange(&subscription_, null)) {
      KEEP_REF_TO_THIS();
      sub->cancel();
      onTerminateImpl();
    }
#ifndef NDEBUG
    else {
      VLOG(2) << "cancel() on BaseSubscriber with no subscription_";
    }
#endif
  }

  void request(int64_t n) {
    if (auto sub = yarpl::atomic_load(&subscription_)) {
      KEEP_REF_TO_THIS();
      sub->request(n);
    }
#ifndef NDEBUG
    else {
      VLOG(2) << "request() on BaseSubscriber with no subscription_";
    }
#endif
  }

 protected:
  virtual void onSubscribeImpl() = 0;
  virtual void onCompleteImpl() = 0;
  virtual void onNextImpl(T) = 0;
  virtual void onErrorImpl(folly::exception_wrapper) = 0;

  virtual void onTerminateImpl() {}

 private:
  bool isTerminated() {
    return !yarpl::atomic_load(&subscription_);
  }

  friend class ::yarpl::flowable::details::BaseSubscriberDisposable<T>;

  // keeps a reference alive to the subscription
  AtomicReference<Subscription> subscription_;

#ifndef NDEBUG
  std::atomic<bool> gotOnSubscribe_{false};
  std::atomic<bool> gotTerminating_{false};
#endif
};

namespace details {

template <typename T>
class BaseSubscriberDisposable : public Disposable {
 public:
  BaseSubscriberDisposable(std::shared_ptr<BaseSubscriber<T>> subscriber)
      : subscriber_(std::move(subscriber)) {}

  void dispose() override {
    if (auto sub = yarpl::atomic_exchange(&subscriber_, nullptr)) {
      sub->cancel();
    }
  }

  bool isDisposed() override {
    if (auto sub = yarpl::atomic_load(&subscriber_)) {
      return sub->isTerminated();
    } else {
      return true;
    }
  }

 private:
  AtomicReference<BaseSubscriber<T>> subscriber_;
};

template <typename T>
class LambdaSubscriber : public BaseSubscriber<T> {
 public:
  template <
      typename Next,
      typename = typename std::enable_if<
          folly::is_invocable<std::decay_t<Next>&, T>::value>::type>
  static std::shared_ptr<LambdaSubscriber<T>> create(
      Next&& next,
      int64_t batch = credits::kNoFlowControl);

  template <
      typename Next,
      typename Error,
      typename = typename std::enable_if<
          folly::is_invocable<std::decay_t<Next>&, T>::value &&
          folly::is_invocable<std::decay_t<Error>&, folly::exception_wrapper>::
              value>::type>
  static std::shared_ptr<LambdaSubscriber<T>>
  create(Next&& next, Error&& error, int64_t batch = credits::kNoFlowControl);

  template <
      typename Next,
      typename Error,
      typename Complete,
      typename = typename std::enable_if<
          folly::is_invocable<std::decay_t<Next>&, T>::value &&
          folly::is_invocable<std::decay_t<Error>&, folly::exception_wrapper>::
              value &&
          folly::is_invocable<std::decay_t<Complete>&>::value>::type>
  static std::shared_ptr<LambdaSubscriber<T>> create(
      Next&& next,
      Error&& error,
      Complete&& complete,
      int64_t batch = credits::kNoFlowControl);
};

template <typename T, typename Next>
class Base : public LambdaSubscriber<T> {
  static_assert(std::is_same<std::decay_t<Next>, Next>::value, "undecayed");

 public:
  template <typename FNext>
  Base(FNext&& next, int64_t batch)
      : next_(std::forward<FNext>(next)), batch_(batch), pending_(0) {}

  void onSubscribeImpl() override final {
    pending_ = batch_;
    this->request(batch_);
  }

  void onNextImpl(T value) override final {
    try {
      next_(std::move(value));
    } catch (const std::exception& exn) {
      this->cancel();
      auto ew = folly::exception_wrapper{std::current_exception(), exn};
      LOG(ERROR) << "'next' method should not throw: " << ew.what();
      onErrorImpl(ew);
      return;
    }

    if (--pending_ <= batch_ / 2) {
      const auto delta = batch_ - pending_;
      pending_ += delta;
      this->request(delta);
    }
  }

  void onCompleteImpl() override {}
  void onErrorImpl(folly::exception_wrapper) override {}

 private:
  Next next_;
  const int64_t batch_;
  int64_t pending_;
};

template <typename T, typename Next, typename Error>
class WithError : public Base<T, Next> {
  static_assert(std::is_same<std::decay_t<Error>, Error>::value, "undecayed");

 public:
  template <typename FNext, typename FError>
  WithError(FNext&& next, FError&& error, int64_t batch)
      : Base<T, Next>(std::forward<FNext>(next), batch),
        error_(std::forward<FError>(error)) {}

  void onErrorImpl(folly::exception_wrapper error) override final {
    try {
      error_(std::move(error));
    } catch (const std::exception& exn) {
      LOG(ERROR) << "'error' method should not throw: " << exn.what();
    }
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
  WithErrorAndComplete(
      FNext&& next,
      FError&& error,
      FComplete&& complete,
      int64_t batch)
      : WithError<T, Next, Error>(
            std::forward<FNext>(next),
            std::forward<FError>(error),
            batch),
        complete_(std::forward<FComplete>(complete)) {}

  void onCompleteImpl() override final {
    try {
      complete_();
    } catch (const std::exception& exn) {
      LOG(ERROR) << "'complete' method should not throw: " << exn.what();
    }
  }

 private:
  Complete complete_;
};

template <typename T>
template <typename Next, typename>
std::shared_ptr<LambdaSubscriber<T>> LambdaSubscriber<T>::create(
    Next&& next,
    int64_t batch) {
  return std::make_shared<details::Base<T, std::decay_t<Next>>>(
      std::forward<Next>(next), batch);
}

template <typename T>
template <typename Next, typename Error, typename>
std::shared_ptr<LambdaSubscriber<T>>
LambdaSubscriber<T>::create(Next&& next, Error&& error, int64_t batch) {
  return std::make_shared<
      details::WithError<T, std::decay_t<Next>, std::decay_t<Error>>>(
      std::forward<Next>(next), std::forward<Error>(error), batch);
}

template <typename T>
template <typename Next, typename Error, typename Complete, typename>
std::shared_ptr<LambdaSubscriber<T>> LambdaSubscriber<T>::create(
    Next&& next,
    Error&& error,
    Complete&& complete,
    int64_t batch) {
  return std::make_shared<details::WithErrorAndComplete<
      T,
      std::decay_t<Next>,
      std::decay_t<Error>,
      std::decay_t<Complete>>>(
      std::forward<Next>(next),
      std::forward<Error>(error),
      std::forward<Complete>(complete),
      batch);
}

} // namespace details

template <typename T>
template <typename Next, typename>
std::shared_ptr<Subscriber<T>> Subscriber<T>::create(
    Next&& next,
    int64_t batch) {
  return details::LambdaSubscriber<T>::create(std::forward<Next>(next), batch);
}

template <typename T>
template <typename Next, typename Error, typename>
std::shared_ptr<Subscriber<T>>
Subscriber<T>::create(Next&& next, Error&& error, int64_t batch) {
  return details::LambdaSubscriber<T>::create(
      std::forward<Next>(next), std::forward<Error>(error), batch);
}

template <typename T>
template <typename Next, typename Error, typename Complete, typename>
std::shared_ptr<Subscriber<T>> Subscriber<T>::create(
    Next&& next,
    Error&& error,
    Complete&& complete,
    int64_t batch) {
  return details::LambdaSubscriber<T>::create(
      std::forward<Next>(next),
      std::forward<Error>(error),
      std::forward<Complete>(complete),
      batch);
}

} // namespace flowable
} // namespace yarpl
