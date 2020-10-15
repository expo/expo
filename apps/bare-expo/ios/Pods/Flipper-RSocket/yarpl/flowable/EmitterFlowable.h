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

#include <atomic>
#include <memory>
#include <utility>

#include <folly/Conv.h>
#include <folly/ScopeGuard.h>

#include "yarpl/flowable/Flowable.h"
#include "yarpl/flowable/Subscriber.h"
#include "yarpl/utils/credits.h"

namespace yarpl {
namespace flowable {
namespace details {

template <typename T>
class EmitterBase {
 public:
  virtual ~EmitterBase() = default;

  virtual std::tuple<int64_t, bool> emit(
      std::shared_ptr<Subscriber<T>>,
      int64_t) = 0;
};

/**
 * Manager for a flowable subscription.
 *
 * This is synchronous: the emit calls are triggered within the context
 * of a request(n) call.
 */
template <typename T>
class EmiterSubscription final : public Subscription,
                                 public Subscriber<T>,
                                 public yarpl::enable_get_ref {
  constexpr static auto kCanceled = credits::kCanceled;
  constexpr static auto kNoFlowControl = credits::kNoFlowControl;

 public:
  EmiterSubscription(
      std::shared_ptr<EmitterBase<T>> emitter,
      std::shared_ptr<Subscriber<T>> subscriber)
      : emitter_(std::move(emitter)), subscriber_(std::move(subscriber)) {}

  void init() {
    subscriber_->onSubscribe(this->ref_from_this(this));
  }

  virtual ~EmiterSubscription() {
    subscriber_.reset();
  }

  void request(int64_t delta) override {
    while (true) {
      auto current = requested_.load(std::memory_order_relaxed);

      if (current == kCanceled) {
        // this can happen because there could be an async barrier between the
        // subscriber and the subscription for instance while onComplete is
        // being delivered (on effectively cancelled subscription) the
        // subscriber can call request(n)
        return;
      }

      auto const total = credits::add(current, delta);
      if (requested_.compare_exchange_strong(current, total)) {
        break;
      }
    }

    process();
  }

  void cancel() override {
    // if this is the first terminating signal to receive, we need to
    // make sure we break the reference cycle between subscription and
    // subscriber
    auto previous = requested_.exchange(kCanceled, std::memory_order_relaxed);
    if (previous != kCanceled) {
      // this can happen because there could be an async barrier between the
      // subscriber and the subscription for instance while onComplete is being
      // delivered (on effectively cancelled subscription) the subscriber can
      // call request(n)
      process();
    }
  }

  // Subscriber methods.
  void onSubscribe(std::shared_ptr<Subscription>) override {
    LOG(FATAL) << "Do not call this method";
  }

  void onNext(T value) override {
#ifndef NDEBUG
    DCHECK(!hasFinished_) << "onComplete() or onError() already called";
#endif
    if (subscriber_) {
      subscriber_->onNext(std::move(value));
    } else {
      DCHECK(requested_.load(std::memory_order_relaxed) == kCanceled);
    }
  }

  void onComplete() override {
#ifndef NDEBUG
    DCHECK(!hasFinished_) << "onComplete() or onError() already called";
    hasFinished_ = true;
#endif
    if (subscriber_) {
      subscriber_->onComplete();
    } else {
      DCHECK(requested_.load(std::memory_order_relaxed) == kCanceled);
    }
  }

  void onError(folly::exception_wrapper error) override {
#ifndef NDEBUG
    DCHECK(!hasFinished_) << "onComplete() or onError() already called";
    hasFinished_ = true;
#endif
    if (subscriber_) {
      subscriber_->onError(error);
    } else {
      DCHECK(requested_.load(std::memory_order_relaxed) == kCanceled);
    }
  }

 private:
  // Processing loop.  Note: this can delete `this` upon completion,
  // error, or cancellation; thus, no fields should be accessed once
  // this method returns.
  //
  // Thread-Safety: there is no guarantee as to which thread this is
  // invoked on.  However, there is a strong guarantee on cancel and
  // request(n) calls: no more than one instance of either of these
  // can be outstanding at any time.
  void process() {
    // Guards against re-entrancy in request(n) calls.
    if (processing_.exchange(true)) {
      return;
    }

    auto guard = folly::makeGuard([this] { processing_ = false; });

    // Keep a reference to ourselves here in case the emit() call
    // frees all other references to 'this'
    auto this_subscriber = this->ref_from_this(this);

    while (true) {
      auto current = requested_.load(std::memory_order_relaxed);

      // Subscription was canceled, completed, or had an error.
      if (current == kCanceled) {
        guard.dismiss();
        release();
        return;
      }

      // If no more items can be emitted now, wait for a request(n).
      // See note above re: thread-safety.  We are guaranteed that
      // request(n) is not simultaneously invoked on another thread.
      if (current <= 0)
        return;

      int64_t emitted;
      bool done;

      std::tie(emitted, done) = emitter_->emit(this_subscriber, current);

      while (true) {
        current = requested_.load(std::memory_order_relaxed);
        if (current == kCanceled) {
          break;
        }
        int64_t updated;
        // generally speaking updated will be number of credits lefted over
        // after emitter_->emit(), so updated = current - emitted
        // need to handle case where done = true and avoid doing arithmetic
        // operation on kNoFlowControl

        // in asynchrnous emitter cases, might have emitted=kNoFlowControl
        // this means that emitter will take the responsibility to send the
        // whole conext and credits lefted over should be set to 0.
        if (current == kNoFlowControl) {
          updated =
              done ? kCanceled : emitted == kNoFlowControl ? 0 : kNoFlowControl;
        } else {
          updated = done ? kCanceled : current - emitted;
        }
        if (requested_.compare_exchange_strong(current, updated)) {
          break;
        }
      }
    }
  }

  void release() {
    emitter_.reset();
    subscriber_.reset();
  }

  // The number of items that can be sent downstream.  Each request(n)
  // adds n; each onNext consumes 1.  If this is MAX, flow-control is
  // disabled: items sent downstream don't consume any longer.  A MIN
  // value represents cancellation.  Other -ve values aren't permitted.
  std::atomic_int_fast64_t requested_{0};

#ifndef NDEBUG
  bool hasFinished_{false}; // onComplete or onError called
#endif

  // We don't want to recursively invoke process(); one loop should do.
  std::atomic_bool processing_{false};

  std::shared_ptr<EmitterBase<T>> emitter_;
  std::shared_ptr<Subscriber<T>> subscriber_;
};

template <typename T>
class TrackingSubscriber : public Subscriber<T> {
 public:
  TrackingSubscriber(
      Subscriber<T>& subscriber,
      int64_t
#ifndef NDEBUG
          requested
#endif
      )
      : inner_(&subscriber)
#ifndef NDEBUG
        ,
        requested_(requested)
#endif
  {
  }

  void onSubscribe(std::shared_ptr<Subscription> s) override {
    inner_->onSubscribe(std::move(s));
  }

  void onComplete() override {
    completed_ = true;
    inner_->onComplete();
  }

  void onError(folly::exception_wrapper ex) override {
    completed_ = true;
    inner_->onError(std::move(ex));
  }

  void onNext(T value) override {
#ifndef NDEBUG
    auto old = requested_;
    DCHECK(old > credits::consume(requested_, 1))
        << "cannot emit more than requested";
#endif
    emitted_++;
    inner_->onNext(std::move(value));
  }

  auto getResult() {
    return std::make_tuple(emitted_, completed_);
  }

 private:
  int64_t emitted_{0};
  bool completed_{false};
  Subscriber<T>* inner_;
#ifndef NDEBUG
  int64_t requested_;
#endif
};

template <typename T, typename Emitter>
class EmitterWrapper : public EmitterBase<T>, public Flowable<T> {
  static_assert(
      std::is_same<std::decay_t<Emitter>, Emitter>::value,
      "undecayed");

 public:
  template <typename F>
  explicit EmitterWrapper(F&& emitter) : emitter_(std::forward<F>(emitter)) {}

  void subscribe(std::shared_ptr<Subscriber<T>> subscriber) override {
    auto ef = std::make_shared<EmiterSubscription<T>>(
        this->ref_from_this(this), std::move(subscriber));
    ef->init();
  }

  std::tuple<int64_t, bool> emit(
      std::shared_ptr<Subscriber<T>> subscriber,
      int64_t requested) override {
    TrackingSubscriber<T> trackingSubscriber(*subscriber, requested);
    emitter_(trackingSubscriber, requested);
    return trackingSubscriber.getResult();
  }

 private:
  Emitter emitter_;
};

} // namespace details
} // namespace flowable
} // namespace yarpl
