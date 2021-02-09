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
#include <condition_variable>
#include <mutex>
#include <sstream>
#include <vector>

#include "yarpl/single/Single.h"
#include "yarpl/single/SingleObserver.h"
#include "yarpl/single/SingleSubscriptions.h"

namespace yarpl {
namespace single {

/**
 * A utility class for unit testing or experimenting with Single.
 *
 * Example usage:
 *
 * auto single = ...
 * auto to = SingleTestObserver<int>::create();
 * single->subscribe(to);
 * ts->awaitTerminalEvent();
 * ts->assert...
 *
 * If you have a SingleObserver impl with specific logic you want used,
 * you can pass it into the SingleTestObserver and the on* events will be
 * delegated to your implementation.
 *
 * For example:
 *
 * auto to = SingleTestObserver<int>::create(std::make_shared<MyObserver>());
 * single->subscribe(to);
 *
 * Now when 'single' is subscribed to, the SingleTestObserver behavior
 * will be used, but 'MyObserver' on* methods will also be invoked.
 *
 * @tparam T
 */
template <typename T>
class SingleTestObserver : public yarpl::single::SingleObserver<T> {
 public:
  /**
   * Create a SingleTestObserver that will subscribe and store the value it
   * receives.
   *
   * @return
   */
  static std::shared_ptr<SingleTestObserver<T>> create() {
    return std::make_shared<SingleTestObserver<T>>();
  }

  /**
   * Create a SingleTestObserver that will delegate all on* method calls
   * to the provided SingleObserver.
   *
   * This will store the value it receives to allow assertions.
   * @return
   */
  static std::shared_ptr<SingleTestObserver<T>> create(
      std::shared_ptr<SingleObserver<T>> delegate) {
    return std::make_shared<SingleTestObserver<T>>(std::move(delegate));
  }

  SingleTestObserver() : delegate_(nullptr) {}

  // Note on thread safety =>
  // Generally an observer assumes single threaded emission
  // but this class is intended for use in unit tests
  // when it will generally receive events on one thread
  // and then access them for verification/assertion
  // on the unit test main thread.

  explicit SingleTestObserver(std::shared_ptr<SingleObserver<T>> delegate)
      : delegate_(std::move(delegate)) {}

  void onSubscribe(std::shared_ptr<SingleSubscription> subscription) override {
    if (delegate_) {
      delegateSubscription_->setDelegate(subscription); // copy
      delegate_->onSubscribe(std::move(subscription));
    } else {
      delegateSubscription_->setDelegate(std::move(subscription));
    }
  }

  void onSuccess(T t) override {
    {
      // take lock with local scope so we can emit without holding the lock
      std::lock_guard<std::mutex> g(m_);
      if (delegate_) {
        value_ = t; // take copy
        // do not emit here, but later without lock
      } else {
        value_ = std::move(t);
      }
      delegateSubscription_ = nullptr;
      terminated_ = true;
    }
    // after lock is released we emit
    if (delegate_) {
      // Do NOT hold the mutex while emitting
      delegate_->onSuccess(std::move(t));
    }
    // then we notify that we're completed
    terminalEventCV_.notify_all();
  }

  void onError(folly::exception_wrapper ex) override {
    if (delegate_) {
      // Do NOT hold the mutex while emitting
      delegate_->onError(ex);
    }
    {
      std::lock_guard<std::mutex> g(m_);
      e_ = std::move(ex);
      terminated_ = true;
    }
    terminalEventCV_.notify_all();
  }

  /**
   * Block the current thread until either onSuccess or onError is called.
   */
  void awaitTerminalEvent() {
    // now block this thread
    std::unique_lock<std::mutex> lk(m_);
    // if shutdown gets implemented this would then be released by it
    terminalEventCV_.wait(lk, [this] { return terminated_; });
  }

  /**
   * Assert no onSuccess or onError events were received
   */
  void assertNoTerminalEvent() {
    std::lock_guard<std::mutex> g(m_);
    if (terminated_) {
      throw std::runtime_error("An unexpected terminal event was received.");
    }
  }
  /**
   * If an onSuccess call was not received throw a runtime_error
   */
  void assertSuccess() {
    std::lock_guard<std::mutex> g(m_);
    if (!terminated_) {
      throw std::runtime_error("Did not receive terminal event.");
    }
    if (e_) {
      std::stringstream ss;
      ss << "Received onError instead of onSuccess";
      ss << " (error was " << e_ << ")";
      throw std::runtime_error(ss.str());
    }
  }

  void assertOnSuccessValue(T t) {
    assertSuccess();
    std::lock_guard<std::mutex> g(m_);
    if (value_ != t) {
      std::stringstream ss;
      ss << "value == " << value_ << ", but expected " << t;
      throw std::runtime_error(ss.str());
    }
  }

  /**
   * Get a reference to the received value if onSuccess was called.
   */
  T& getOnSuccessValue() {
    std::lock_guard<std::mutex> g(m_);
    return value_;
  }

  /**
   * Get the error received from onError if it was called.
   */
  folly::exception_wrapper getError() {
    std::lock_guard<std::mutex> g(m_);
    if (!terminated_) {
      throw std::logic_error{"Must call getError() on a terminated observer"};
    }
    return e_;
  }

  /**
   * If the onError exception_wrapper points to an error containing
   * the given msg, complete successfully, otherwise throw a runtime_error
   */
  void assertOnErrorMessage(std::string msg) {
    std::lock_guard<std::mutex> g(m_);
    if (!e_ || e_.get_exception()->what() != msg) {
      std::stringstream ss;
      ss << "Error is: " << e_ << " but expected: " << msg;
      throw std::runtime_error(ss.str());
    }
  }

  folly::exception_wrapper getException() const {
    return e_;
  }

  /**
   * Submit SingleSubscription->cancel();
   */
  void cancel() {
    // do NOT hold a lock while invoking the normal signals
    delegateSubscription_->cancel();
  }

 private:
  std::mutex m_;
  std::condition_variable terminalEventCV_;
  std::shared_ptr<SingleObserver<T>> delegate_;
  // The following variables must be protected by mutex m_
  T value_;
  folly::exception_wrapper e_;
  bool terminated_{false};
  // allows thread-safe cancellation against a delegate
  // regardless of when it is received
  std::shared_ptr<DelegateSingleSubscription> delegateSubscription_{
      std::make_shared<DelegateSingleSubscription>()};
};
} // namespace single
} // namespace yarpl
