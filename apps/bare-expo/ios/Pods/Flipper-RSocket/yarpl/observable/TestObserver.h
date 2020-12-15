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

#include <condition_variable>
#include <mutex>
#include <sstream>
#include <vector>

#include "yarpl/Observable.h"

namespace yarpl {
namespace observable {

/**
 * A utility class for unit testing or experimenting with Observable.
 *
 * Example usage:
 *
 * auto observable = ...
 * auto ts = std::make_shared<TestObserver<int>>();
 * observable->subscribe(ts->unique_observer());
 * ts->awaitTerminalEvent();
 * ts->assert...
 *
 * If you have an Observer impl with specific logic you want used,
 * you can pass it into the TestObserver and the on* events will be
 * delegated to your implementation.
 *
 * For example:
 *
 * auto ts =
 * std::make_shared<TestObserver<int>>(std::make_unique<MyObserver>());
 * observable->subscribe(ts->unique_observer());
 *
 * Now when 'observable' is subscribed to, the TestObserver behavior
 * will be used, but 'MyObserver' on* methods will also be invoked.
 *
 * @tparam T
 */
template <typename T>
class TestObserver : public yarpl::observable::Observer<T>,
                     public std::enable_shared_from_this<TestObserver<T>> {
  using Subscription = yarpl::observable::Subscription;
  using Observer = yarpl::observable::Observer<T>;

 public:
  TestObserver();
  explicit TestObserver(std::unique_ptr<Observer> delegate);

  void onSubscribe(std::shared_ptr<Subscription> s) override;
  void onNext(T t) override;
  void onComplete() override;
  void onError(folly::exception_wrapper ex) override;

  /**
   * Get a unique Observer<T> that can be passed into the Observable.subscribe
   * method which requires a unique_ptr<Observer>.
   *
   * This decouples the lifetime of TestObserver from what is passed into
   * the Observable.subscribe method so that the testing code can retain
   * a reference to TestObserver to use it beyond the lifecycle
   * of Observable.subscribe.
   *
   * @return
   */
  std::unique_ptr<yarpl::observable::Observer<T>> unique_observer();

  /**
   * Block the current thread until either onComplete or onError is called.
   */
  void awaitTerminalEvent(
      std::chrono::milliseconds ms = std::chrono::seconds{1});

  /**
   * If the onNext values received does not match the given count,
   * throw a runtime_error
   */
  void assertValueCount(size_t count);

  /**
   * The number of onNext values received.
   * @return
   */
  int64_t getValueCount();

  /**
   * Get a reference to a stored value at a given index position.
   *
   * The values are stored in the order received from onNext.
   */
  T& getValueAt(size_t index);

  /**
   * If the onError exception_wrapper points to an error containing
   * the given msg, complete successfully, otherwise throw a runtime_error
   */
  void assertOnErrorMessage(std::string msg);

  /**
   * Submit Subscription->cancel();
   */
  void cancel();

  bool isComplete() const {
    return complete_;
  }

  bool isError() const {
    return error_;
  }

 private:
  std::unique_ptr<Observer> delegate_;
  std::vector<T> values_;
  folly::exception_wrapper e_;
  bool terminated_{false};
  bool complete_{false};
  bool error_{false};
  std::mutex m_;
  std::condition_variable terminalEventCV_;
  std::shared_ptr<Subscription> subscription_;
};

template <typename T>
TestObserver<T>::TestObserver() : delegate_(nullptr){};

template <typename T>
TestObserver<T>::TestObserver(std::unique_ptr<Observer> delegate)
    : delegate_(std::move(delegate)){};

template <typename T>
void TestObserver<T>::onSubscribe(std::shared_ptr<Subscription> s) {
  subscription_ = s;
  if (delegate_) {
    delegate_->onSubscribe(s);
  }
}

template <typename T>
void TestObserver<T>::onNext(T t) {
  if (delegate_) {
    //    std::cout << "TestObserver onNext& => copy then delegate" <<
    //    std::endl;
    values_.push_back(t);
    delegate_->onNext(t);
  } else {
    //    std::cout << "TestObserver onNext& => copy" << std::endl;
    values_.push_back(t);
  }
}

template <typename T>
void TestObserver<T>::onComplete() {
  if (delegate_) {
    delegate_->onComplete();
  }
  terminated_ = true;
  complete_ = true;
  terminalEventCV_.notify_all();
}

template <typename T>
void TestObserver<T>::onError(folly::exception_wrapper ex) {
  if (delegate_) {
    delegate_->onError(ex);
  }
  e_ = std::move(ex);
  terminated_ = true;
  error_ = true;
  terminalEventCV_.notify_all();
}

template <typename T>
void TestObserver<T>::awaitTerminalEvent(std::chrono::milliseconds ms) {
  // now block this thread
  std::unique_lock<std::mutex> lk(m_);
  // if shutdown gets implemented this would then be released by it
  if (!terminalEventCV_.wait_for(lk, ms, [this] { return terminated_; })) {
    throw std::runtime_error("timeout in awaitTerminalEvent");
  }
}

template <typename T>
void TestObserver<T>::cancel() {
  subscription_->cancel();
}

template <typename T>
std::unique_ptr<yarpl::observable::Observer<T>>
TestObserver<T>::unique_observer() {
  class UObserver : public yarpl::observable::Observer<T> {
   public:
    UObserver(std::shared_ptr<TestObserver<T>> ts) : ts_(std::move(ts)) {}

    void onSubscribe(yarpl::observable::Subscription* s) override {
      ts_->onSubscribe(s);
    }

    void onNext(const T& t) override {
      ts_->onNext(t);
    }

    void onError(folly::exception_wrapper e) override {
      ts_->onError(std::move(e));
    }

    void onComplete() override {
      ts_->onComplete();
    }

   private:
    std::shared_ptr<TestObserver<T>> ts_;
  };

  return std::make_unique<UObserver>(this->shared_from_this());
}

template <typename T>
void TestObserver<T>::assertValueCount(size_t count) {
  if (values_.size() != count) {
    std::stringstream ss;
    ss << "Value count " << values_.size() << " does not match " << count;
    throw std::runtime_error(ss.str());
  }
}
template <typename T>
int64_t TestObserver<T>::getValueCount() {
  return values_.size();
}

template <typename T>
T& TestObserver<T>::getValueAt(size_t index) {
  return values_[index];
}

template <typename T>
void TestObserver<T>::assertOnErrorMessage(std::string msg) {
  if (!e_ || e_.get_exception()->what() != msg) {
    std::stringstream ss;
    ss << "Error is: " << e_ << " but expected: " << msg;
    throw std::runtime_error(ss.str());
  }
}
} // namespace observable
} // namespace yarpl
