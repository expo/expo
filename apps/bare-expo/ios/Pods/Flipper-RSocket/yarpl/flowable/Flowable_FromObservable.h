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

#include <folly/Synchronized.h>
#include <deque>
#include "yarpl/Common.h"
#include "yarpl/Flowable.h"
#include "yarpl/utils/credits.h"

namespace yarpl {
namespace observable {
template <typename T>
class Observable;

template <typename T>
class Observer;
} // namespace observable

template <typename T>
class BackpressureStrategyBase : public IBackpressureStrategy<T>,
                                 public flowable::Subscription,
                                 public observable::Observer<T> {
 protected:
  //
  // the following methods are to be overridden
  //
  virtual void onCreditsAvailable(int64_t /*credits*/) = 0;
  virtual void onNextWithoutCredits(T /*t*/) = 0;

 public:
  void init(
      std::shared_ptr<observable::Observable<T>> observable,
      std::shared_ptr<flowable::Subscriber<T>> subscriber) override {
    observable_ = std::move(observable);
    subscriberWeak_ = subscriber;
    subscriber_ = subscriber;
    subscriber->onSubscribe(this->ref_from_this(this));
    observable_->subscribe(this->ref_from_this(this));
  }

  BackpressureStrategyBase() = default;
  BackpressureStrategyBase(BackpressureStrategyBase&&) = delete;

  BackpressureStrategyBase(const BackpressureStrategyBase&) = delete;
  BackpressureStrategyBase& operator=(BackpressureStrategyBase&&) = delete;
  BackpressureStrategyBase& operator=(const BackpressureStrategyBase&) = delete;

  // only for testing purposes
  void setTestSubscriber(std::shared_ptr<flowable::Subscriber<T>> subscriber) {
    subscriberWeak_ = subscriber;
    subscriber_ = subscriber;
    subscriber->onSubscribe(this->ref_from_this(this));
  }

  void request(int64_t n) override {
    if (n <= 0) {
      return;
    }
    auto r = credits::add(&requested_, n);
    if (r <= 0) {
      return;
    }

    // it is possible that after calling subscribe or in onCreditsAvailable
    // methods, there will be a stream of
    // onNext calls which the processing chain might cancel. The cancel signal
    // will remove all references to this class and we need to keep this
    // instance around to finish this method
    auto thisPtr = this->ref_from_this(this);

    if (r > 0) {
      onCreditsAvailable(r);
    }
  }

  void cancel() override {
    if (auto subscriber = subscriber_.exchange(nullptr)) {
      observable::Observer<T>::unsubscribe();
      observable_.reset();
    }
  }

  // Observer override
  void onNext(T t) override {
    if (subscriberWeak_.expired()) {
      return;
    }
    if (requested_ > 0) {
      downstreamOnNext(std::move(t));
      return;
    }
    onNextWithoutCredits(std::move(t));
  }

  // Observer override
  void onComplete() override {
    downstreamOnComplete();
  }

  // Observer override
  void onError(folly::exception_wrapper ex) override {
    downstreamOnError(std::move(ex));
  }

  virtual void downstreamOnNext(T t) {
    credits::consume(&requested_, 1);
    if (auto subscriber = subscriberWeak_.lock()) {
      subscriber->onNext(std::move(t));
    }
  }

  void downstreamOnComplete() {
    if (auto subscriber = subscriber_.exchange(nullptr)) {
      subscriber->onComplete();
      observable::Observer<T>::onComplete();
      observable_.reset();
    }
  }

  void downstreamOnError(folly::exception_wrapper error) {
    if (auto subscriber = subscriber_.exchange(nullptr)) {
      subscriber->onError(std::move(error));
      observable::Observer<T>::onError(folly::exception_wrapper());
      observable_.reset();
    }
  }

  void downstreamOnErrorAndCancel(folly::exception_wrapper error) {
    if (auto subscriber = subscriber_.exchange(nullptr)) {
      subscriber->onError(std::move(error));

      observable_.reset();
      observable::Observer<T>::unsubscribe();
    }
  }

 private:
  std::shared_ptr<observable::Observable<T>> observable_;
  folly::Synchronized<std::shared_ptr<flowable::Subscriber<T>>> subscriber_;
  std::weak_ptr<flowable::Subscriber<T>> subscriberWeak_;
  std::atomic<int64_t> requested_{0};
};

template <typename T>
class DropBackpressureStrategy : public BackpressureStrategyBase<T> {
 public:
  void onCreditsAvailable(int64_t /*credits*/) override {}
  void onNextWithoutCredits(T /*t*/) override {
    // drop anything while we don't have credits
  }
};

template <typename T>
class ErrorBackpressureStrategy : public BackpressureStrategyBase<T> {
  using Super = BackpressureStrategyBase<T>;

  void onCreditsAvailable(int64_t /*credits*/) override {}

  void onNextWithoutCredits(T /*t*/) override {
    Super::downstreamOnErrorAndCancel(flowable::MissingBackpressureException());
  }
};

template <typename T>
class BufferBackpressureStrategy : public BackpressureStrategyBase<T> {
 public:
  static constexpr size_t kNoLimit = 0;

  explicit BufferBackpressureStrategy(size_t bufferSizeLimit = kNoLimit)
      : buffer_(folly::in_place, bufferSizeLimit) {}

 private:
  using Super = BackpressureStrategyBase<T>;

  void onComplete() override {
    if (!buffer_.rlock()->empty()) {
      // we have buffered some items so we will defer delivering on complete for
      // later
      completed_ = true;
    } else {
      Super::onComplete();
    }
  }

  void onNext(T t) override {
    {
      auto buffer = buffer_.wlock();
      if (!buffer->empty()) {
        if (buffer->push(std::move(t))) {
          return;
        }
        buffer.unlock();
        Super::downstreamOnErrorAndCancel(
            flowable::MissingBackpressureException());
        return;
      }
    }
    BackpressureStrategyBase<T>::onNext(std::move(t));
  }

  //
  // onError signal is delivered immediately by design
  //

  void onNextWithoutCredits(T t) override {
    if (buffer_.wlock()->push(std::move(t))) {
      return;
    }
    Super::downstreamOnErrorAndCancel(flowable::MissingBackpressureException());
  }

  void onCreditsAvailable(int64_t credits) override {
    DCHECK(credits > 0);
    auto lockedBuffer = buffer_.wlock();
    while (credits-- > 0 && !lockedBuffer->empty()) {
      Super::downstreamOnNext(std::move(lockedBuffer->front()));
      lockedBuffer->pop();
    }

    if (lockedBuffer->empty() && completed_) {
      Super::onComplete();
    }
  }

  struct Buffer {
   public:
    explicit Buffer(size_t sizeLimit) : sizeLimit_(sizeLimit) {}

    bool empty() const {
      return buffer_.empty();
    }

    bool push(T&& value) {
      if (sizeLimit_ != kNoLimit && buffer_.size() >= sizeLimit_) {
        return false;
      }
      buffer_.push(std::move(value));
      return true;
    }

    T& front() {
      return buffer_.front();
    }

    void pop() {
      buffer_.pop();
    }

   private:
    const size_t sizeLimit_;
    std::queue<T> buffer_;
  };

  folly::Synchronized<Buffer> buffer_;
  std::atomic<bool> completed_{false};
};

template <typename T>
class LatestBackpressureStrategy : public BackpressureStrategyBase<T> {
  using Super = BackpressureStrategyBase<T>;

  void onComplete() override {
    if (storesLatest_) {
      // we have buffered an item so we will defer delivering on complete for
      // later
      completed_ = true;
    } else {
      Super::onComplete();
    }
  }

  //
  // onError signal is delivered immediately by design
  //

  void onNextWithoutCredits(T t) override {
    storesLatest_ = true;
    *latest_.wlock() = std::move(t);
  }

  void onCreditsAvailable(int64_t credits) override {
    DCHECK(credits > 0);
    if (storesLatest_) {
      storesLatest_ = false;
      Super::downstreamOnNext(std::move(*latest_.wlock()));

      if (completed_) {
        Super::onComplete();
      }
    }
  }

  std::atomic<bool> storesLatest_{false};
  std::atomic<bool> completed_{false};
  folly::Synchronized<T> latest_;
};

template <typename T>
class MissingBackpressureStrategy : public BackpressureStrategyBase<T> {
  using Super = BackpressureStrategyBase<T>;

  void onCreditsAvailable(int64_t /*credits*/) override {}

  void onNextWithoutCredits(T t) override {
    // call onNext anyways (and potentially violating the protocol)
    Super::downstreamOnNext(std::move(t));
  }
};

template <typename T>
std::shared_ptr<IBackpressureStrategy<T>> IBackpressureStrategy<T>::buffer() {
  return std::make_shared<BufferBackpressureStrategy<T>>();
}

template <typename T>
std::shared_ptr<IBackpressureStrategy<T>> IBackpressureStrategy<T>::drop() {
  return std::make_shared<DropBackpressureStrategy<T>>();
}

template <typename T>
std::shared_ptr<IBackpressureStrategy<T>> IBackpressureStrategy<T>::error() {
  return std::make_shared<ErrorBackpressureStrategy<T>>();
}

template <typename T>
std::shared_ptr<IBackpressureStrategy<T>> IBackpressureStrategy<T>::latest() {
  return std::make_shared<LatestBackpressureStrategy<T>>();
}

template <typename T>
std::shared_ptr<IBackpressureStrategy<T>> IBackpressureStrategy<T>::missing() {
  return std::make_shared<MissingBackpressureStrategy<T>>();
}

} // namespace yarpl
