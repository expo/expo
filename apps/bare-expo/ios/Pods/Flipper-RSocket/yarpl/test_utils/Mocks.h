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
#include <chrono>
#include <condition_variable>
#include <exception>

#include <folly/ExceptionWrapper.h>
#include <gmock/gmock.h>

#include "yarpl/flowable/Flowable.h"

namespace yarpl {
namespace mocks {

/// GoogleMock-compatible Publisher implementation for fast prototyping.
/// UnmanagedMockPublisher's lifetime MUST be managed externally.
template <typename T>
class MockFlowable : public flowable::Flowable<T> {
 public:
  MOCK_METHOD1_T(
      subscribe_,
      void(std::shared_ptr<flowable::Subscriber<T>> subscriber));

  void subscribe(
      std::shared_ptr<flowable::Subscriber<T>> subscriber) noexcept override {
    subscribe_(std::move(subscriber));
  }
};

/// GoogleMock-compatible Subscriber implementation for fast prototyping.
/// MockSubscriber MUST be heap-allocated, as it manages its own lifetime.
/// For the same reason putting mock instance in a smart pointer is a poor idea.
/// Can only be instanciated for CopyAssignable E type.
template <typename T>
class MockSubscriber : public flowable::Subscriber<T>,
                       public yarpl::enable_get_ref {
 public:
  MOCK_METHOD1(
      onSubscribe_,
      void(std::shared_ptr<flowable::Subscription> subscription));
  MOCK_METHOD1_T(onNext_, void(const T& value));
  MOCK_METHOD0(onComplete_, void());
  MOCK_METHOD1_T(onError_, void(folly::exception_wrapper ex));

  explicit MockSubscriber(int64_t initial = std::numeric_limits<int64_t>::max())
      : initial_(initial) {}

  void onSubscribe(
      std::shared_ptr<flowable::Subscription> subscription) override {
    subscription_ = subscription;
    auto this_ = this->ref_from_this(this);
    onSubscribe_(subscription);

    if (initial_ > 0) {
      subscription_->request(initial_);
    }
  }

  void onNext(T element) override {
    auto this_ = this->ref_from_this(this);
    onNext_(element);

    --waitedFrameCount_;
    framesEventCV_.notify_one();
  }

  void onComplete() override {
    auto this_ = this->ref_from_this(this);
    onComplete_();
    subscription_.reset();
    terminated_ = true;
    terminalEventCV_.notify_all();
  }

  void onError(folly::exception_wrapper ex) override {
    auto this_ = this->ref_from_this(this);
    onError_(std::move(ex));
    terminated_ = true;
    terminalEventCV_.notify_all();
  }

  flowable::Subscription* subscription() const {
    return subscription_.operator->();
  }

  /**
   * Block the current thread until either onSuccess or onError is called.
   */
  void awaitTerminalEvent(
      std::chrono::milliseconds timeout = std::chrono::seconds(1)) {
    // now block this thread
    std::unique_lock<std::mutex> lk(m_);
    // if shutdown gets implemented this would then be released by it
    bool result =
        terminalEventCV_.wait_for(lk, timeout, [this] { return terminated_; });
    EXPECT_TRUE(result) << "Timed out";
  }

  /**
   * Block the current thread until onNext is called 'count' times.
   */
  void awaitFrames(
      uint64_t count,
      std::chrono::milliseconds timeout = std::chrono::seconds(1)) {
    waitedFrameCount_ += count;
    std::unique_lock<std::mutex> lk(mFrame_);
    if (waitedFrameCount_ > 0) {
      bool result = framesEventCV_.wait_for(
          lk, timeout, [this] { return waitedFrameCount_ <= 0; });
      EXPECT_TRUE(result) << "Timed out";
    }
  }

 protected:
  // As the 'subscription_' member in the parent class is private,
  // we define it here again.
  std::shared_ptr<flowable::Subscription> subscription_;

  int64_t initial_;

  bool terminated_{false};
  mutable std::mutex m_, mFrame_;
  mutable std::condition_variable terminalEventCV_, framesEventCV_;
  mutable std::atomic<int> waitedFrameCount_{0};
};

/// GoogleMock-compatible Subscriber implementation for fast prototyping.
/// MockSubscriber MUST be heap-allocated, as it manages its own lifetime.
/// For the same reason putting mock instance in a smart pointer is a poor idea.
class MockSubscription : public flowable::Subscription {
 public:
  MOCK_METHOD1(request_, void(int64_t n));
  MOCK_METHOD0(cancel_, void());

  void request(int64_t n) override {
    request_(n);
  }

  void cancel() override {
    cancel_();
  }
};
} // namespace mocks

template <typename T, bool keep_reference_to_this = true>
class MockBaseSubscriber
    : public flowable::BaseSubscriber<T, keep_reference_to_this> {
 public:
  MOCK_METHOD0_T(onSubscribeImpl, void());
  MOCK_METHOD1_T(onNextImpl, void(T));
  MOCK_METHOD0_T(onCompleteImpl, void());
  MOCK_METHOD1_T(onErrorImpl, void(folly::exception_wrapper));
};

} // namespace yarpl
