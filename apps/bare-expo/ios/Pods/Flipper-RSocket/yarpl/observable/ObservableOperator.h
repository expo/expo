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

#include <utility>

#include <folly/functional/Invoke.h>

#include "yarpl/Observable.h"
#include "yarpl/observable/Observer.h"
#include "yarpl/observable/Observable.h"

namespace yarpl {
namespace observable {

/**
 * Base (helper) class for operators.  Operators are templated on two types:
 * D (downstream) and U (upstream).  Operators are created by method calls on
 * an upstream Observable, and are Observables themselves.  Multi-stage
 * pipelines
 * can be built: a Observable heading a sequence of Operators.
 */
template <typename U, typename D>
class ObservableOperator : public Observable<D> {
 protected:
  /// An Operator's subscription.
  ///
  /// When a pipeline chain is active, each Observable has a corresponding
  /// subscription.  Except for the first one, the subscriptions are created
  /// against Operators.  Each operator subscription has two functions: as a
  /// subscriber for the previous stage; as a subscription for the next one,
  /// the user-supplied subscriber being the last of the pipeline stages.
  class OperatorSubscription : public ::yarpl::observable::Subscription,
                               public Observer<U> {
   protected:
    explicit OperatorSubscription(std::shared_ptr<Observer<D>> observer)
        : observer_(std::move(observer)) {
      assert(observer_);
    }

    void observerOnNext(D value) {
      if (observer_) {
        observer_->onNext(std::move(value));
      }
    }

    /// Terminates both ends of an operator normally.
    void terminate() {
      terminateImpl(TerminateState::Both());
    }

    /// Terminates both ends of an operator with an error.
    void terminateErr(folly::exception_wrapper ex) {
      terminateImpl(TerminateState::Both(), std::move(ex));
    }

    // Subscription.

    void cancel() override {
      Subscription::cancel();
      terminateImpl(TerminateState::Up());
    }

    // Observer.

    void onSubscribe(std::shared_ptr<yarpl::observable::Subscription>
                         subscription) override {
      if (upstream_) {
        DLOG(ERROR) << "attempt to subscribe twice";
        subscription->cancel();
        return;
      }
      upstream_ = std::move(subscription);
      observer_->onSubscribe(this->ref_from_this(this));
    }

    void onComplete() override {
      terminateImpl(TerminateState::Down());
    }

    void onError(folly::exception_wrapper ex) override {
      terminateImpl(TerminateState::Down(), std::move(ex));
    }

   private:
    struct TerminateState {
      TerminateState(bool u, bool d) : up{u}, down{d} {}

      static TerminateState Down() {
        return TerminateState{false, true};
      }

      static TerminateState Up() {
        return TerminateState{true, false};
      }

      static TerminateState Both() {
        return TerminateState{true, true};
      }

      const bool up{false};
      const bool down{false};
    };

    bool isTerminated() const {
      return !upstream_ && !observer_;
    }

    /// Terminates an operator, sending cancel() and on{Complete,Error}()
    /// signals as necessary.
    void terminateImpl(
        TerminateState state,
        folly::exception_wrapper ex = folly::exception_wrapper{nullptr}) {
      if (isTerminated()) {
        return;
      }

      if (auto upstream = std::move(upstream_)) {
        if (state.up) {
          upstream->cancel();
        }
      }

      if (auto observer = std::move(observer_)) {
        if (state.down) {
          if (ex) {
            observer->onError(std::move(ex));
          } else {
            observer->onComplete();
          }
        }
      }
    }

    /// This subscription controls the life-cycle of the observer. The
    /// observer is retained as long as calls on it can be made.  (Note:
    /// the observer in turn maintains a reference on this subscription
    /// object until cancellation and/or completion.)
    std::shared_ptr<Observer<D>> observer_;

    /// In an active pipeline, cancel and (possibly modified) request(n)
    /// calls should be forwarded upstream.  Note that `this` is also a
    /// observer for the upstream stage: thus, there are cycles; all of
    /// the objects drop their references at cancel/complete.
    // TODO(lehecka): this is extra field... base class has this member so
    // remove it
    std::shared_ptr<::yarpl::observable::Subscription> upstream_;
  };
};

template <typename U, typename D, typename F>
class MapOperator : public ObservableOperator<U, D> {
  using Super = ObservableOperator<U, D>;
  static_assert(std::is_same<std::decay_t<F>, F>::value, "undecayed");
  static_assert(folly::is_invocable_r<D, F, U>::value, "not invocable");

 public:
  template <typename Func>
  MapOperator(std::shared_ptr<Observable<U>> upstream, Func&& function)
      : upstream_(std::move(upstream)),
        function_(std::forward<Func>(function)) {}

  std::shared_ptr<Subscription> subscribe(
      std::shared_ptr<Observer<D>> observer) override {
    auto subscription = std::make_shared<MapSubscription>(
        this->ref_from_this(this), std::move(observer));
    upstream_->subscribe(
        // Note: implicit cast to a reference to a observer.
        subscription);
    return subscription;
  }

 private:
  class MapSubscription : public Super::OperatorSubscription {
    using SuperSub = typename Super::OperatorSubscription;

   public:
    MapSubscription(
        std::shared_ptr<MapOperator> observable,
        std::shared_ptr<Observer<D>> observer)
        : SuperSub(std::move(observer)), observable_(std::move(observable)) {}

    void onNext(U value) override {
      try {
        this->observerOnNext(observable_->function_(std::move(value)));
      } catch (const std::exception& exn) {
        folly::exception_wrapper ew{std::current_exception(), exn};
        this->terminateErr(std::move(ew));
      }
    }

   private:
    std::shared_ptr<MapOperator> observable_;
  };

  std::shared_ptr<Observable<U>> upstream_;
  F function_;
};

template <typename U, typename F>
class FilterOperator : public ObservableOperator<U, U> {
  using Super = ObservableOperator<U, U>;
  static_assert(std::is_same<std::decay_t<F>, F>::value, "undecayed");
  static_assert(folly::is_invocable_r<bool, F, U>::value, "not invocable");

 public:
  template <typename Func>
  FilterOperator(std::shared_ptr<Observable<U>> upstream, Func&& function)
      : upstream_(std::move(upstream)),
        function_(std::forward<Func>(function)) {}

  std::shared_ptr<Subscription> subscribe(
      std::shared_ptr<Observer<U>> observer) override {
    auto subscription = std::make_shared<FilterSubscription>(
        this->ref_from_this(this), std::move(observer));
    upstream_->subscribe(
        // Note: implicit cast to a reference to a observer.
        subscription);
    return subscription;
  }

 private:
  class FilterSubscription : public Super::OperatorSubscription {
    using SuperSub = typename Super::OperatorSubscription;

   public:
    FilterSubscription(
        std::shared_ptr<FilterOperator> observable,
        std::shared_ptr<Observer<U>> observer)
        : SuperSub(std::move(observer)), observable_(std::move(observable)) {}

    void onNext(U value) override {
      if (observable_->function_(value)) {
        SuperSub::observerOnNext(std::move(value));
      }
    }

   private:
    std::shared_ptr<FilterOperator> observable_;
  };

  std::shared_ptr<Observable<U>> upstream_;
  F function_;
};

template <typename U, typename D, typename F>
class ReduceOperator : public ObservableOperator<U, D> {
  using Super = ObservableOperator<U, D>;
  static_assert(std::is_same<std::decay_t<F>, F>::value, "undecayed");
  static_assert(std::is_assignable<D&, U>::value, "not assignable");
  static_assert(folly::is_invocable_r<D, F, D, U>::value, "not invocable");

 public:
  template <typename Func>
  ReduceOperator(std::shared_ptr<Observable<U>> upstream, Func&& function)
      : upstream_(std::move(upstream)),
        function_(std::forward<Func>(function)) {}

  std::shared_ptr<Subscription> subscribe(
      std::shared_ptr<Observer<D>> subscriber) override {
    auto subscription = std::make_shared<ReduceSubscription>(
        this->ref_from_this(this), std::move(subscriber));
    upstream_->subscribe(
        // Note: implicit cast to a reference to a subscriber.
        subscription);
    return subscription;
  }

 private:
  class ReduceSubscription : public Super::OperatorSubscription {
    using SuperSub = typename Super::OperatorSubscription;

   public:
    ReduceSubscription(
        std::shared_ptr<ReduceOperator> observable,
        std::shared_ptr<Observer<D>> observer)
        : SuperSub(std::move(observer)),
          observable_(std::move(observable)),
          accInitialized_(false) {}

    void onNext(U value) override {
      if (accInitialized_) {
        acc_ = observable_->function_(std::move(acc_), std::move(value));
      } else {
        acc_ = std::move(value);
        accInitialized_ = true;
      }
    }

    void onComplete() override {
      if (accInitialized_) {
        SuperSub::observerOnNext(std::move(acc_));
      }
      SuperSub::onComplete();
    }

   private:
    std::shared_ptr<ReduceOperator> observable_;
    bool accInitialized_;
    D acc_;
  };

  std::shared_ptr<Observable<U>> upstream_;
  F function_;
};

template <typename T>
class TakeOperator : public ObservableOperator<T, T> {
  using Super = ObservableOperator<T, T>;

 public:
  TakeOperator(std::shared_ptr<Observable<T>> upstream, int64_t limit)
      : upstream_(std::move(upstream)), limit_(limit) {}

  std::shared_ptr<Subscription> subscribe(
      std::shared_ptr<Observer<T>> observer) override {
    auto subscription =
        std::make_shared<TakeSubscription>(limit_, std::move(observer));
    upstream_->subscribe(subscription);
    return subscription;
  }

 private:
  class TakeSubscription : public Super::OperatorSubscription {
    using SuperSub = typename Super::OperatorSubscription;

   public:
    TakeSubscription(int64_t limit, std::shared_ptr<Observer<T>> observer)
        : SuperSub(std::move(observer)), limit_(limit) {}

    void onSubscribe(std::shared_ptr<yarpl::observable::Subscription>
                         subscription) override {
      SuperSub::onSubscribe(std::move(subscription));

      if (limit_ <= 0) {
        SuperSub::terminate();
      }
    }

    void onNext(T value) override {
      if (limit_-- > 0) {
        SuperSub::observerOnNext(std::move(value));
        if (limit_ == 0) {
          SuperSub::terminate();
        }
      }
    }

   private:
    int64_t limit_;
  };

  std::shared_ptr<Observable<T>> upstream_;
  const int64_t limit_;
};

template <typename T>
class SkipOperator : public ObservableOperator<T, T> {
  using Super = ObservableOperator<T, T>;

 public:
  SkipOperator(std::shared_ptr<Observable<T>> upstream, int64_t offset)
      : upstream_(std::move(upstream)), offset_(offset) {}

  std::shared_ptr<Subscription> subscribe(
      std::shared_ptr<Observer<T>> observer) override {
    auto subscription =
        std::make_shared<SkipSubscription>(offset_, std::move(observer));
    upstream_->subscribe(subscription);
    return subscription;
  }

 private:
  class SkipSubscription : public Super::OperatorSubscription {
    using SuperSub = typename Super::OperatorSubscription;

   public:
    SkipSubscription(int64_t offset, std::shared_ptr<Observer<T>> observer)
        : SuperSub(std::move(observer)), offset_(offset) {}

    void onNext(T value) override {
      if (offset_ <= 0) {
        SuperSub::observerOnNext(std::move(value));
      } else {
        --offset_;
      }
    }

   private:
    int64_t offset_;
  };

  std::shared_ptr<Observable<T>> upstream_;
  const int64_t offset_;
};

template <typename T>
class IgnoreElementsOperator : public ObservableOperator<T, T> {
  using Super = ObservableOperator<T, T>;

 public:
  explicit IgnoreElementsOperator(std::shared_ptr<Observable<T>> upstream)
      : upstream_(std::move(upstream)) {}

  std::shared_ptr<Subscription> subscribe(
      std::shared_ptr<Observer<T>> observer) override {
    auto subscription =
        std::make_shared<IgnoreElementsSubscription>(std::move(observer));
    upstream_->subscribe(subscription);
    return subscription;
  }

 private:
  class IgnoreElementsSubscription : public Super::OperatorSubscription {
    using SuperSub = typename Super::OperatorSubscription;

   public:
    IgnoreElementsSubscription(std::shared_ptr<Observer<T>> observer)
        : SuperSub(std::move(observer)) {}

    void onNext(T) override {}
  };

  std::shared_ptr<Observable<T>> upstream_;
};

template <typename T>
class SubscribeOnOperator : public ObservableOperator<T, T> {
  using Super = ObservableOperator<T, T>;

 public:
  SubscribeOnOperator(
      std::shared_ptr<Observable<T>> upstream,
      folly::Executor& executor)
      : upstream_(std::move(upstream)), executor_(executor) {}

  std::shared_ptr<Subscription> subscribe(
      std::shared_ptr<Observer<T>> observer) override {
    auto subscription = std::make_shared<SubscribeOnSubscription>(
        executor_, std::move(observer));
    executor_.add([subscription, upstream = upstream_]() mutable {
      upstream->subscribe(std::move(subscription));
    });
    return subscription;
  }

 private:
  class SubscribeOnSubscription : public Super::OperatorSubscription {
    using SuperSub = typename Super::OperatorSubscription;

   public:
    SubscribeOnSubscription(
        folly::Executor& executor,
        std::shared_ptr<Observer<T>> observer)
        : SuperSub(std::move(observer)), executor_(executor) {}

    void cancel() override {
      executor_.add([self = this->ref_from_this(this), this] {
        this->callSuperCancel();
      });
    }

    void onNext(T value) override {
      SuperSub::observerOnNext(std::move(value));
    }

   private:
    // Trampoline to call superclass method; gcc bug 58972.
    void callSuperCancel() {
      SuperSub::cancel();
    }

    folly::Executor& executor_;
  };

  std::shared_ptr<Observable<T>> upstream_;
  folly::Executor& executor_;
};

template <typename T, typename OnSubscribe>
class FromPublisherOperator : public Observable<T> {
  static_assert(
      std::is_same<std::decay_t<OnSubscribe>, OnSubscribe>::value,
      "undecayed");

 public:
  template <typename F>
  explicit FromPublisherOperator(F&& function)
      : function_(std::forward<F>(function)) {}

 private:
  class PublisherObserver : public Observer<T> {
   public:
    PublisherObserver(
        std::shared_ptr<Observer<T>> inner,
        std::shared_ptr<Subscription> subscription)
        : inner_(std::move(inner)) {
      Observer<T>::onSubscribe(std::move(subscription));
    }

    void onSubscribe(std::shared_ptr<Subscription>) override {
      DLOG(ERROR) << "not allowed to call";
      CHECK(false);
    }

    void onComplete() override {
      if (auto inner = atomic_exchange(&inner_, nullptr)) {
        inner->onComplete();
      }
      Observer<T>::onComplete();
    }

    void onError(folly::exception_wrapper ex) override {
      if (auto inner = atomic_exchange(&inner_, nullptr)) {
        inner->onError(std::move(ex));
      }
      Observer<T>::onError(folly::exception_wrapper());
    }

    void onNext(T t) override {
      atomic_load(&inner_)->onNext(std::move(t));
    }

   private:
    AtomicReference<Observer<T>> inner_;
  };

 public:
  std::shared_ptr<Subscription> subscribe(
      std::shared_ptr<Observer<T>> observer) override {
    auto subscription = Subscription::create();
    observer->onSubscribe(subscription);

    if (!subscription->isCancelled()) {
      function_(std::make_shared<PublisherObserver>(
              std::move(observer), subscription), subscription);
    }
    return subscription;
  }

 private:
  OnSubscribe function_;
};
} // namespace observable
} // namespace yarpl

#include "yarpl/observable/ObservableConcatOperators.h"
#include "yarpl/observable/ObservableDoOperator.h"
