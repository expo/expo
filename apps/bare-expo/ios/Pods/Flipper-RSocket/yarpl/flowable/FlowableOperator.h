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

#include <cassert>
#include <mutex>
#include <utility>

#include "yarpl/flowable/Flowable.h"
#include "yarpl/flowable/Subscriber.h"
#include "yarpl/flowable/Subscription.h"
#include "yarpl/utils/credits.h"

#include <boost/intrusive/list.hpp>
#include <folly/Executor.h>
#include <folly/Synchronized.h>
#include <folly/functional/Invoke.h>
#include <folly/io/async/EventBase.h>

namespace yarpl {
namespace flowable {

/**
 * Base (helper) class for operators.  Operators are templated on two types: D
 * (downstream) and U (upstream).  Operators are created by method calls on an
 * upstream Flowable, and are Flowables themselves.  Multi-stage pipelines can
 * be built: a Flowable heading a sequence of Operators.
 */
template <typename U, typename D>
class FlowableOperator : public Flowable<D> {
 protected:
  /// An Operator's subscription.
  ///
  /// When a pipeline chain is active, each Flowable has a corresponding
  /// subscription.  Except for the first one, the subscriptions are created
  /// against Operators.  Each operator subscription has two functions: as a
  /// subscriber for the previous stage; as a subscription for the next one, the
  /// user-supplied subscriber being the last of the pipeline stages.
  class Subscription : public yarpl::flowable::Subscription,
                       public BaseSubscriber<U> {
   protected:
    explicit Subscription(std::shared_ptr<Subscriber<D>> subscriber)
        : subscriber_(std::move(subscriber)) {
      CHECK(yarpl::atomic_load(&subscriber_));
    }

    // Subscriber will be provided by the init(Subscriber) call
    Subscription() {}

    virtual void init(std::shared_ptr<Subscriber<D>> subscriber) {
      if (yarpl::atomic_load(&subscriber_)) {
        subscriber->onSubscribe(yarpl::flowable::Subscription::create());
        subscriber->onError(std::runtime_error("already initialized"));
        return;
      }
      subscriber_ = std::move(subscriber);
    }

    void subscriberOnNext(D value) {
      if (auto subscriber = yarpl::atomic_load(&subscriber_)) {
        subscriber->onNext(std::move(value));
      }
    }

    /// Terminates both ends of an operator normally.
    void terminate() {
      std::shared_ptr<Subscriber<D>> null;
      auto subscriber = yarpl::atomic_exchange(&subscriber_, null);
      BaseSubscriber<U>::cancel();
      if (subscriber) {
        subscriber->onComplete();
      }
    }

    /// Terminates both ends of an operator with an error.
    void terminateErr(folly::exception_wrapper ew) {
      std::shared_ptr<Subscriber<D>> null;
      auto subscriber = yarpl::atomic_exchange(&subscriber_, null);
      BaseSubscriber<U>::cancel();
      if (subscriber) {
        subscriber->onError(std::move(ew));
      }
    }

    // Subscription.

    void request(int64_t n) override {
      BaseSubscriber<U>::request(n);
    }

    void cancel() override {
      std::shared_ptr<Subscriber<D>> null;
      auto subscriber = yarpl::atomic_exchange(&subscriber_, null);
      BaseSubscriber<U>::cancel();
    }

    // Subscriber.

    void onSubscribeImpl() override {
      yarpl::atomic_load(&subscriber_)->onSubscribe(this->ref_from_this(this));
    }

    void onCompleteImpl() override {
      std::shared_ptr<Subscriber<D>> null;
      if (auto subscriber = yarpl::atomic_exchange(&subscriber_, null)) {
        subscriber->onComplete();
      }
    }

    void onErrorImpl(folly::exception_wrapper ew) override {
      std::shared_ptr<Subscriber<D>> null;
      if (auto subscriber = yarpl::atomic_exchange(&subscriber_, null)) {
        subscriber->onError(std::move(ew));
      }
    }

   private:
    /// This subscription controls the life-cycle of the subscriber.  The
    /// subscriber is retained as long as calls on it can be made.  (Note: the
    /// subscriber in turn maintains a reference on this subscription object
    /// until cancellation and/or completion.)
    AtomicReference<Subscriber<D>> subscriber_;
  };
};

template <typename U, typename D, typename F, typename EF>
class MapOperator : public FlowableOperator<U, D> {
  using Super = FlowableOperator<U, D>;
  static_assert(std::is_same<std::decay_t<F>, F>::value, "undecayed");
  static_assert(folly::is_invocable_r<D, F, U>::value, "not invocable");
  static_assert(
      folly::is_invocable_r<
          folly::exception_wrapper,
          EF,
          folly::exception_wrapper&&>::value,
      "exception handler not invocable");

 public:
  template <typename Func, typename ErrorFunc>
  MapOperator(
      std::shared_ptr<Flowable<U>> upstream,
      Func&& function,
      ErrorFunc&& errFunction)
      : upstream_(std::move(upstream)),
        function_(std::forward<Func>(function)),
        errFunction_(std::move(errFunction)) {}

  void subscribe(std::shared_ptr<Subscriber<D>> subscriber) override {
    upstream_->subscribe(std::make_shared<Subscription>(
        this->ref_from_this(this), std::move(subscriber)));
  }

 private:
  using SuperSubscription = typename Super::Subscription;
  class Subscription : public SuperSubscription {
   public:
    Subscription(
        std::shared_ptr<MapOperator> flowable,
        std::shared_ptr<Subscriber<D>> subscriber)
        : SuperSubscription(std::move(subscriber)),
          flowable_(std::move(flowable)) {}

    void onNextImpl(U value) override {
      try {
        if (auto flowable = yarpl::atomic_load(&flowable_)) {
          this->subscriberOnNext(flowable->function_(std::move(value)));
        }
      } catch (const std::exception& exn) {
        folly::exception_wrapper ew{std::current_exception(), exn};
        this->terminateErr(std::move(ew));
      }
    }

    void onErrorImpl(folly::exception_wrapper ew) override {
      try {
        if (auto flowable = yarpl::atomic_load(&flowable_)) {
          SuperSubscription::onErrorImpl(flowable->errFunction_(std::move(ew)));
        }
      } catch (const std::exception& exn) {
        this->terminateErr(
            folly::exception_wrapper{std::current_exception(), exn});
      }
    }

    void onTerminateImpl() override {
      yarpl::atomic_exchange(&flowable_, nullptr);
      SuperSubscription::onTerminateImpl();
    }

   private:
    AtomicReference<MapOperator> flowable_;
  };

  std::shared_ptr<Flowable<U>> upstream_;
  F function_;
  EF errFunction_;
};

template <typename U, typename F>
class FilterOperator : public FlowableOperator<U, U> {
  // for use in subclasses
  using Super = FlowableOperator<U, U>;
  static_assert(std::is_same<std::decay_t<F>, F>::value, "undecayed");
  static_assert(folly::is_invocable_r<bool, F, U>::value, "not invocable");

 public:
  template <typename Func>
  FilterOperator(std::shared_ptr<Flowable<U>> upstream, Func&& function)
      : upstream_(std::move(upstream)),
        function_(std::forward<Func>(function)) {}

  void subscribe(std::shared_ptr<Subscriber<U>> subscriber) override {
    upstream_->subscribe(std::make_shared<Subscription>(
        this->ref_from_this(this), std::move(subscriber)));
  }

 private:
  using SuperSubscription = typename Super::Subscription;
  class Subscription : public SuperSubscription {
   public:
    Subscription(
        std::shared_ptr<FilterOperator> flowable,
        std::shared_ptr<Subscriber<U>> subscriber)
        : SuperSubscription(std::move(subscriber)),
          flowable_(std::move(flowable)) {}

    void onNextImpl(U value) override {
      if (auto flowable = yarpl::atomic_load(&flowable_)) {
        if (flowable->function_(value)) {
          SuperSubscription::subscriberOnNext(std::move(value));
        } else {
          SuperSubscription::request(1);
        }
      }
    }

    void onTerminateImpl() override {
      yarpl::atomic_exchange(&flowable_, nullptr);
      SuperSubscription::onTerminateImpl();
    }

   private:
    AtomicReference<FilterOperator> flowable_;
  };

  std::shared_ptr<Flowable<U>> upstream_;
  F function_;
};

template <typename U, typename D, typename F>
class ReduceOperator : public FlowableOperator<U, D> {
  using Super = FlowableOperator<U, D>;
  static_assert(std::is_same<std::decay_t<F>, F>::value, "undecayed");
  static_assert(std::is_assignable<D&, U>::value, "not assignable");
  static_assert(folly::is_invocable_r<D, F, D, U>::value, "not invocable");

 public:
  template <typename Func>
  ReduceOperator(std::shared_ptr<Flowable<U>> upstream, Func&& function)
      : upstream_(std::move(upstream)),
        function_(std::forward<Func>(function)) {}

  void subscribe(std::shared_ptr<Subscriber<D>> subscriber) override {
    upstream_->subscribe(std::make_shared<Subscription>(
        this->ref_from_this(this), std::move(subscriber)));
  }

 private:
  using SuperSubscription = typename Super::Subscription;
  class Subscription : public SuperSubscription {
   public:
    Subscription(
        std::shared_ptr<ReduceOperator> flowable,
        std::shared_ptr<Subscriber<D>> subscriber)
        : SuperSubscription(std::move(subscriber)),
          flowable_(std::move(flowable)),
          accInitialized_(false) {}

    void request(int64_t) override {
      // Request all of the items.
      SuperSubscription::request(credits::kNoFlowControl);
    }

    void onNextImpl(U value) override {
      if (accInitialized_) {
        if (auto flowable = yarpl::atomic_load(&flowable_)) {
          acc_ = flowable->function_(std::move(acc_), std::move(value));
        }
      } else {
        acc_ = std::move(value);
        accInitialized_ = true;
      }
    }

    void onCompleteImpl() override {
      if (accInitialized_) {
        SuperSubscription::subscriberOnNext(std::move(acc_));
      }
      SuperSubscription::onCompleteImpl();
    }

    void onTerminateImpl() override {
      yarpl::atomic_exchange(&flowable_, nullptr);
      SuperSubscription::onTerminateImpl();
    }

   private:
    AtomicReference<ReduceOperator> flowable_;
    bool accInitialized_;
    D acc_;
  };

  std::shared_ptr<Flowable<U>> upstream_;
  F function_;
};

template <typename T>
class TakeOperator : public FlowableOperator<T, T> {
  using Super = FlowableOperator<T, T>;

 public:
  TakeOperator(std::shared_ptr<Flowable<T>> upstream, int64_t limit)
      : upstream_(std::move(upstream)), limit_(limit) {}

  void subscribe(std::shared_ptr<Subscriber<T>> subscriber) override {
    upstream_->subscribe(
        std::make_shared<Subscription>(limit_, std::move(subscriber)));
  }

 private:
  using SuperSubscription = typename Super::Subscription;
  class Subscription : public SuperSubscription {
   public:
    Subscription(int64_t limit, std::shared_ptr<Subscriber<T>> subscriber)
        : SuperSubscription(std::move(subscriber)), limit_(limit) {}

    void onSubscribeImpl() override {
      SuperSubscription::onSubscribeImpl();

      if (limit_ <= 0) {
        SuperSubscription::terminate();
      }
    }

    void onNextImpl(T value) override {
      if (limit_-- > 0) {
        if (pending_ > 0) {
          --pending_;
        }
        SuperSubscription::subscriberOnNext(std::move(value));
        if (limit_ == 0) {
          SuperSubscription::terminate();
        }
      }
    }

    void request(int64_t delta) override {
      delta = std::min(delta, limit_ - pending_);
      if (delta > 0) {
        pending_ += delta;
        SuperSubscription::request(delta);
      }
    }

   private:
    int64_t pending_{0};
    int64_t limit_;
  };

  std::shared_ptr<Flowable<T>> upstream_;
  const int64_t limit_;
};

template <typename T>
class SkipOperator : public FlowableOperator<T, T> {
  using Super = FlowableOperator<T, T>;

 public:
  SkipOperator(std::shared_ptr<Flowable<T>> upstream, int64_t offset)
      : upstream_(std::move(upstream)), offset_(offset) {}

  void subscribe(std::shared_ptr<Subscriber<T>> subscriber) override {
    upstream_->subscribe(
        std::make_shared<Subscription>(offset_, std::move(subscriber)));
  }

 private:
  using SuperSubscription = typename Super::Subscription;
  class Subscription : public SuperSubscription {
   public:
    Subscription(int64_t offset, std::shared_ptr<Subscriber<T>> subscriber)
        : SuperSubscription(std::move(subscriber)), offset_(offset) {}

    void onNextImpl(T value) override {
      if (offset_ > 0) {
        --offset_;
      } else {
        SuperSubscription::subscriberOnNext(std::move(value));
      }
    }

    void request(int64_t delta) override {
      if (firstRequest_) {
        firstRequest_ = false;
        delta = credits::add(delta, offset_);
      }
      SuperSubscription::request(delta);
    }

   private:
    int64_t offset_;
    bool firstRequest_{true};
  };

  std::shared_ptr<Flowable<T>> upstream_;
  const int64_t offset_;
};

template <typename T>
class IgnoreElementsOperator : public FlowableOperator<T, T> {
  using Super = FlowableOperator<T, T>;

 public:
  explicit IgnoreElementsOperator(std::shared_ptr<Flowable<T>> upstream)
      : upstream_(std::move(upstream)) {}

  void subscribe(std::shared_ptr<Subscriber<T>> subscriber) override {
    upstream_->subscribe(std::make_shared<Subscription>(std::move(subscriber)));
  }

 private:
  using SuperSubscription = typename Super::Subscription;
  class Subscription : public SuperSubscription {
   public:
    Subscription(std::shared_ptr<Subscriber<T>> subscriber)
        : SuperSubscription(std::move(subscriber)) {}

    void onNextImpl(T) override {}
  };

  std::shared_ptr<Flowable<T>> upstream_;
};

template <typename T>
class SubscribeOnOperator : public FlowableOperator<T, T> {
  using Super = FlowableOperator<T, T>;

 public:
  SubscribeOnOperator(
      std::shared_ptr<Flowable<T>> upstream,
      folly::Executor& executor)
      : upstream_(std::move(upstream)), executor_(executor) {}

  void subscribe(std::shared_ptr<Subscriber<T>> subscriber) override {
    executor_.add([this, self = this->ref_from_this(this), subscriber] {
      upstream_->subscribe(
          std::make_shared<Subscription>(executor_, std::move(subscriber)));
    });
  }

 private:
  using SuperSubscription = typename Super::Subscription;
  class Subscription : public SuperSubscription {
   public:
    Subscription(
        folly::Executor& executor,
        std::shared_ptr<Subscriber<T>> subscriber)
        : SuperSubscription(std::move(subscriber)), executor_(executor) {}

    void request(int64_t delta) override {
      executor_.add([delta, this, self = this->ref_from_this(this)] {
        this->callSuperRequest(delta);
      });
    }

    void cancel() override {
      executor_.add([this, self = this->ref_from_this(this)] {
        this->callSuperCancel();
      });
    }

    void onNextImpl(T value) override {
      SuperSubscription::subscriberOnNext(std::move(value));
    }

   private:
    // Trampoline to call superclass method; gcc bug 58972.
    void callSuperRequest(int64_t delta) {
      SuperSubscription::request(delta);
    }

    // Trampoline to call superclass method; gcc bug 58972.
    void callSuperCancel() {
      SuperSubscription::cancel();
    }

    folly::Executor& executor_;
  };

  std::shared_ptr<Flowable<T>> upstream_;
  folly::Executor& executor_;
};

template <typename T, typename OnSubscribe>
class FromPublisherOperator : public Flowable<T> {
  static_assert(
      std::is_same<std::decay_t<OnSubscribe>, OnSubscribe>::value,
      "undecayed");

 public:
  template <typename F>
  explicit FromPublisherOperator(F&& function)
      : function_(std::forward<F>(function)) {}

  void subscribe(std::shared_ptr<Subscriber<T>> subscriber) override {
    function_(std::move(subscriber));
  }

 private:
  OnSubscribe function_;
};

template <typename T, typename R>
class FlatMapOperator : public FlowableOperator<T, R> {
  using Super = FlowableOperator<T, R>;

 public:
  FlatMapOperator(
      std::shared_ptr<Flowable<T>> upstream,
      folly::Function<std::shared_ptr<Flowable<R>>(T)> func)
      : upstream_(std::move(upstream)), function_(std::move(func)) {}

  void subscribe(std::shared_ptr<Subscriber<R>> subscriber) override {
    upstream_->subscribe(std::make_shared<FMSubscription>(
        this->ref_from_this(this), std::move(subscriber)));
  }

 private:
  using SuperSubscription = typename Super::Subscription;
  class FMSubscription : public SuperSubscription {
    struct MappedStreamSubscriber;

   public:
    FMSubscription(
        std::shared_ptr<FlatMapOperator> flowable,
        std::shared_ptr<Subscriber<R>> subscriber)
        : SuperSubscription(std::move(subscriber)),
          flowable_(std::move(flowable)) {}

    void onSubscribeImpl() final {
      liveSubscribers_++;
      SuperSubscription::onSubscribeImpl();
    }

    void onNextImpl(T value) final {
      std::shared_ptr<Flowable<R>> mappedStream;

      try {
        mappedStream = flowable_->function_(std::move(value));
      } catch (const std::exception& exn) {
        folly::exception_wrapper ew{std::current_exception(), exn};
        {
          std::lock_guard<std::mutex> g(onErrorExGuard_);
          onErrorEx_ = ew;
        }
        // next iteration of drainLoop will cancel this subscriber as well
        drainLoop();
        return;
      }

      std::shared_ptr<MappedStreamSubscriber> mappedSubscriber =
          std::make_shared<MappedStreamSubscriber>(this->ref_from_this(this));
      mappedSubscriber->fmReference_ = mappedSubscriber;

      {
        // put into pendingValue queue because once the mappedSubscriber
        // is subscribed to, it will request elements. We don't want the
        // drainLoop to execute while it's on withoutValue, and request
        // a second element before the first arrives.
        auto l = lists.wlock();
        CHECK(!mappedSubscriber->is_linked());
        l->pendingValue.push_back(*mappedSubscriber.get());
      }

      liveSubscribers_++;
      mappedStream->subscribe(mappedSubscriber);
      drainLoop();
    }

    void drainImpl() {
      // phase 1: clear out terminated subscribers
      {
        auto clearList = [](auto& list, SubscriberList& t) {
          while (!list.empty()) {
            auto& elem = list.front();
            auto r = elem.sync.wlock();
            r->freeze = true;
            elem.unlink();
            t.push_back(elem);
          }
        };

        SubscriberList clearTrash;
        if (clearAllSubscribers_.load()) {
          auto l = lists.wlock();
          clearList(l->withValue, clearTrash);
          clearList(l->withoutValue, clearTrash);
          clearList(l->pendingValue, clearTrash);
        }

        // clear elements while no locks are held
        while (!clearTrash.empty()) {
          auto& elem = clearTrash.front();
          elem.unlink();
          elem.cancel();
          elem.fmReference_ = nullptr;
        }
      }

      // phase 2: check if the subscriber should terminate due to error
      // or all subscribers completing
      if (!calledDownstreamTerminate_) {
        folly::exception_wrapper ex;
        {
          std::lock_guard<std::mutex> exg(onErrorExGuard_);
          ex = std::move(onErrorEx_);
        }
        if (ex) {
          calledDownstreamTerminate_ = true;
          cancel();
          this->terminateErr(std::move(ex));
        } else if (liveSubscribers_ == 0) {
          calledDownstreamTerminate_ = true;
          this->terminate();
        }
      }

      // phase 3: if the downstream has requested elements, pop values out of
      // subscribers which have received a value and call downstream->onNext
      while (requested_ != 0) {
        R val;

        {
          auto l = lists.wlock();
          if (l->withValue.empty()) {
            break;
          }

          requested_--;
          auto& elem = l->withValue.front();
          elem.unlink();

          {
            auto r = elem.sync.wlock();
            CHECK(r->hasValue);
            r->hasValue = false;
            val = std::move(r->value);
            l->withoutValue.push_back(elem);
          }
        }

        SuperSubscription::subscriberOnNext(std::move(val));
      }

      // phase 4: ask any upstream flowables which don't have pending
      // requests for their next element kick off any more requests.
      // Put subscribers which have terminated into the trash.
      {
        SubscriberList terminatedTrash;

        while (true) {
          MappedStreamSubscriber* elem;
          {
            auto l = lists.wlock();
            if (l->withoutValue.empty()) {
              break;
            }
            elem = &l->withoutValue.front();

            auto r = elem->sync.wlock();
            CHECK(!r->hasValue) << "failed for elem=" << elem; // sanity

            elem->unlink();

            // Subscribers might call onNext and then terminate; delay
            // removing its liveSubscriber reference until we've delivered
            // its element to the downstream subscriber and dropped its
            // synchronized reference to `r`, as dropping the
            // flatMapSubscription_ reference may invoke its destructor
            if (r->isTerminated) {
              r->freeze = true;
              terminatedTrash.push_back(*elem);
              continue; // skips the next elem->request(1)
            }

            // else, the stream hasn't terminated, request another
            // element
            l->pendingValue.push_back(*elem);
          }
          elem->request(1);
        }

        // phase 5: destroy any mapped subscribers which have terminated,
        // enqueue another drain loop run if we do end up discarding any
        // subscribers, as our live subscriber count may have gone to zero
        if (!terminatedTrash.empty()) {
          drainLoopMutex_++;
        }
        while (!terminatedTrash.empty()) {
          auto& elem = terminatedTrash.front();
          CHECK(elem.sync.wlock()->isTerminated);
          elem.unlink();
          elem.fmReference_ = nullptr;
          liveSubscribers_--;
        }
      }
    }

    // called from MappedStreamSubscriber, receives the R and the
    // subscriber which generated the R
    void drainLoop() {
      auto self = this->ref_from_this(this);
      if (drainLoopMutex_++ == 0) {
        do {
          drainImpl();
        } while (drainLoopMutex_-- != 1);
      }
    }

    void onMappedSubscriberNext(MappedStreamSubscriber* elem, R value) {
      {
        // `elem` may not be in a list, as it may have been canceled. Push it
        // on the withValue list and let drainLoop clear it if that's the case.
        auto l = lists.wlock();
        auto r = elem->sync.wlock();

        if (r->freeze) {
          return;
        }

        CHECK(!r->hasValue) << "failed for elem=" << elem;
        r->hasValue = true;
        r->value = std::move(value);

        elem->unlink();
        l->withValue.push_back(*elem);
      }

      drainLoop();
    }
    void onMappedSubscriberTerminate(MappedStreamSubscriber* elem) {
      {
        auto r = elem->sync.wlock();

        r->isTerminated = true;
        if (r->onErrorEx) {
          std::lock_guard<std::mutex> exg(onErrorExGuard_);
          onErrorEx_ = std::move(r->onErrorEx);
        }

        if (r->freeze) {
          return;
        }
      }

      {
        auto l = lists.wlock();
        auto r = elem->sync.wlock();

        if (r->freeze) {
          return;
        }

        CHECK(elem->is_linked());
        elem->unlink();

        if (r->hasValue) {
          l->withValue.push_back(*elem);
        } else {
          liveSubscribers_--;
          elem->fmReference_ = nullptr;
        }
      }

      drainLoop();
    }

    // onComplete/onError fall through to onTerminateImpl, which
    // will call drainLoop and update the liveSubscribers_ count
    void onCompleteImpl() final {}
    void onErrorImpl(folly::exception_wrapper ex) final {
      std::lock_guard<std::mutex> g(onErrorExGuard_);
      onErrorEx_ = std::move(ex);
      clearAllSubscribers_.store(true);
    }

    void onTerminateImpl() final {
      liveSubscribers_--;
      drainLoop();
      flowable_.reset();
    }

    void request(int64_t n) override {
      if ((n + requested_) < requested_) {
        requested_ = std::numeric_limits<int64_t>::max();
      } else {
        requested_ += n;
      }

      if (n > 0) {
        // TODO: make max parallelism configurable a-la RxJava 2.x's
        // FlowableFlatMapOperator
        SuperSubscription::request(std::numeric_limits<int64_t>::max());
      }

      drainLoop();
    }

    void cancel() override {
      clearAllSubscribers_.store(true);
      drainLoop();
    }

   private:
    // buffers at most a single element of type R
    struct MappedStreamSubscriber
        : public BaseSubscriber<R>,
          public boost::intrusive::list_base_hook<
              boost::intrusive::link_mode<boost::intrusive::auto_unlink>> {
      MappedStreamSubscriber(std::shared_ptr<FMSubscription> subscription)
          : flatMapSubscription_(std::move(subscription)) {}

      void onSubscribeImpl() final {
        auto fmsb = yarpl::atomic_load(&flatMapSubscription_);
        if (!fmsb || fmsb->clearAllSubscribers_) {
          BaseSubscriber<R>::cancel();
          return;
        }
#ifndef NDEBUG
        if (auto fms = yarpl::atomic_load(&flatMapSubscription_)) {
          auto l = fms->lists.wlock();
          auto r = sync.wlock();
          if (!is_in_list(*this, l->pendingValue, l)) {
            LOG(INFO) << "failed: this=" << this;
            LOG(INFO) << "in list: ";
            debug_is_in_list(*this, l);
            DCHECK(r->freeze);
          } else {
          }
          DCHECK(!r->hasValue);
        }
#endif

        BaseSubscriber<R>::request(1);
      }

      void onNextImpl(R value) final {
        if (auto fms = yarpl::atomic_load(&flatMapSubscription_)) {
          fms->onMappedSubscriberNext(this, std::move(value));
        }
      }

      // noop
      void onCompleteImpl() final {}

      void onErrorImpl(folly::exception_wrapper ex) final {
        auto r = sync.wlock();
        r->onErrorEx = std::move(ex);
      }

      void onTerminateImpl() override {
        std::shared_ptr<FMSubscription> null;
        if (auto fms = yarpl::atomic_exchange(&flatMapSubscription_, null)) {
          fms->onMappedSubscriberTerminate(this);
        }
      }

      struct SyncData {
        R value;
        bool hasValue{false};
        bool isTerminated{false};
        bool freeze{false};
        folly::exception_wrapper onErrorEx{nullptr};
      };
      folly::Synchronized<SyncData> sync;

      // FMSubscription's 'reference' to this object. FMSubscription
      // clears this reference when it drops the MappedStreamSubscriber
      // from one of its atomic lists
      std::shared_ptr<MappedStreamSubscriber> fmReference_{nullptr};

      // this is both a Subscriber and a Subscription<T>
      AtomicReference<FMSubscription> flatMapSubscription_{nullptr};
    };

    // used to make sure only one thread at a time is calling subscriberOnNext
    std::atomic<int64_t> drainLoopMutex_{0};

    using SubscriberList = boost::intrusive::list<
        MappedStreamSubscriber,
        boost::intrusive::constant_time_size<false>>;

    struct Lists {
      // subscribers with a ready R
      SubscriberList withValue{};
      // subscribers that have requested 1 R, waiting for it to arrive via
      // onNext
      SubscriberList pendingValue{};
      // idle subscribers
      SubscriberList withoutValue{};
    };

    folly::Synchronized<Lists> lists;

    template <typename L>
    static bool is_in_list(
        MappedStreamSubscriber const& elem,
        SubscriberList const& list,
        L const& lists) {
      return in_list_impl(elem, list, lists, true);
    }
    template <typename L>
    static bool not_in_list(
        MappedStreamSubscriber const& elem,
        SubscriberList const& list,
        L const& lists) {
      return in_list_impl(elem, list, lists, false);
    }

    template <typename L>
    static bool in_list_impl(
        MappedStreamSubscriber const& elem,
        SubscriberList const& list,
        L const& lists,
        bool should) {
      if (is_in_list(elem, list) != should) {
#ifndef NDEBUG
        debug_is_in_list(elem, lists);
#else
        (void)lists;
#endif
        return false;
      }
      return true;
    }

    template <typename L>
    static void debug_is_in_list(
        MappedStreamSubscriber const& elem,
        L const& lists) {
      LOG(INFO) << "in without: " << is_in_list(elem, lists->withoutValue);
      LOG(INFO) << "in pending: " << is_in_list(elem, lists->pendingValue);
      LOG(INFO) << "in withval: " << is_in_list(elem, lists->withValue);
    }

    static bool is_in_list(
        MappedStreamSubscriber const& elem,
        SubscriberList const& list) {
      bool found = false;
      for (auto& e : list) {
        if (&e == &elem) {
          found = true;
          break;
        }
      }
      return found;
    }

    std::shared_ptr<FlatMapOperator> flowable_;

    // got a terminating signal from the upstream flowable
    // always modified in the protected drainImpl()
    bool calledDownstreamTerminate_{false};

    std::mutex onErrorExGuard_;
    folly::exception_wrapper onErrorEx_{nullptr};

    // clear all lists of
    std::atomic<bool> clearAllSubscribers_{false};

    std::atomic<int64_t> requested_{0};

    // number of subscribers (FMSubscription + MappedStreamSubscriber) which
    // have not received a terminating signal yet
    std::atomic<int64_t> liveSubscribers_{0};
  };

  std::shared_ptr<Flowable<T>> upstream_;
  folly::Function<std::shared_ptr<Flowable<R>>(T)> function_;
};

} // namespace flowable
} // namespace yarpl

#include "yarpl/flowable/FlowableConcatOperators.h"
#include "yarpl/flowable/FlowableDoOperator.h"
#include "yarpl/flowable/FlowableObserveOnOperator.h"
#include "yarpl/flowable/FlowableTimeoutOperator.h"
